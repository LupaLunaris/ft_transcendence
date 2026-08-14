
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Phaser from 'phaser';
import type {
  DuelStartPayload,
  RaceResult,
  GameState,
  Direction,
  AchievementCode,
  RewardResult,
} from '@ft/shared';
import { useAuth } from '@/context/auth.context';
import { useSocket } from '@/context/socket.context';
import { DuelScene } from '@/game/scenes/DuelScene';
import { AVATAR_TO_SPRITE, DEFAULT_PLAYER_SPRITE } from '@/game/assets';
import { useMapLeaderboard } from '@/hooks/useLeaderboard';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/useToast';
import { api } from '@/services/api.service';
import { useTranslation } from 'react-i18next';
import { TouchPad } from '@/components/ui/TouchPad';
import { ScaledGameFrame } from '@/components/game/ScaledGameFrame';
import { createPortal } from 'react-dom';

const ACHIEVEMENT_LABEL: Record<AchievementCode, string> = {
  FIRST_ESCAPE: 'first_escape',
  FIRST_CREATOR: 'first_creator',
  EXPLORER: 'explorer',
  DUEL_CHAMPION: 'duel_champion',
};

const CANVAS_W = 800;
const CANVAS_H = 600;

// ─── Overlay résultat ─────────────────────────────────────────────────────────
// Classement complet (2 à 4 joueurs) — remplace le win/lose binaire de la
// version 2 joueurs, cf. shared/src/types/game.types.ts RaceRankingEntry.

function ResultOverlay({
  result,
  myId,
  onLeave,
}: {
  result: RaceResult;
  myId:   string;
  onLeave: () => void;
}) {
  const { t } = useTranslation();

  const mine = result.ranking.find(r => r.user_id === myId);
  const won  = mine?.rank === 1;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg gap-4">
      <p className="text-5xl">{won ? '🏆' : '💀'}</p>
      <p className="text-2xl font-bold text-white font-fantasy">
        {won ? t('duel_game_page.win') : t('duel_game_page.lose')}
      </p>

      <ol className="flex flex-col gap-1 text-sm min-w-[220px]">
        {result.ranking.map((entry) => (
          <li
            key={entry.user_id}
            className={[
              'flex items-center justify-between px-3 py-1.5 rounded',
              entry.user_id === myId ? 'bg-deep-700/60 text-white' : 'text-white/60',
            ].join(' ')}
          >
            <span>{entry.rank}. {entry.username}</span>
            <span>
              {entry.finished
                ? t('duel_game_page.time', { time: (entry.duration_ms! / 1000).toFixed(2) })
                : '—'}
            </span>
          </li>
        ))}
      </ol>

      <Button variant="primary" onClick={onLeave}>
        {t('duel_game_page.back_duel')}
      </Button>
    </div>
  );
}

// ─── DuelGamePage ─────────────────────────────────────────────────────────────

export function DuelGamePage() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const state = location.state as DuelStartPayload | null;
  const raceId = state?.race_id;
  const userId = user?.id;
  const { entries: leaderboardEntries, loading: leaderboardLoading } = useMapLeaderboard(state?.map_id);

  const containerRef  = useRef<HTMLDivElement>(null);
  const gameRef       = useRef<Phaser.Game | null>(null);
  const socketRef = useRef<typeof socket>(null);
  useEffect(() => { socketRef.current = socket; }, [socket]);
  const translateRef = useRef(t);
  translateRef.current = t;
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;
  const updateUserRef = useRef(updateUser);
  updateUserRef.current = updateUser;
  // Dernier game_state reçu, indépendamment de l'état de chargement de la
  // scène Phaser — permet de rattraper la scène dès qu'elle signale 'scene_ready'
  // (cf. effect Phaser ci-dessous : sans ce cache, un game_state émis avant que
  // create() ait enregistré ses listeners est perdu pour toujours, ce qui
  // laisse un adversaire qui finit très vite figé au spawn sur les écrans plus
  // lents à charger — cf. frontend_doc/duel-nplayer-remote-rendering.md).
  const lastGameStateRef = useRef<GameState | null>(null);

  const [result,      setResult]      = useState<RaceResult | null>(null);
  const [waiting,     setWaiting]     = useState(true);
  const [myFinished,  setMyFinished]  = useState(false);
  const [myAlive,     setMyAlive]     = useState(true);

  // Redirige si on arrive sans state (navigation directe)
  useEffect(() => {
    if (!state) navigate('/duel', { replace: true });
  }, [state, navigate]);

  // ── Socket : connexion + join_race ────────────────────────────────────────
  // Dépend explicitement de user?.id : sans ça, si cet effect se monte avant
  // que /auth/me ait résolu (AuthProvider pose `token` avant `user`, cf.
  // auth.context.tsx), la closure de 'game_state' capture user=null pour
  // toute la durée de la connexion socket (l'effect ne se relance jamais).
  useEffect(() => {
    if (!raceId || !userId || !socket) return;

    const currentRaceId = raceId;
    const duelSocket = socket;

    function handleGameState(gameState: GameState) {
      if (!gameState.started) return;
      setWaiting(false);
      lastGameStateRef.current = gameState;

      const me = gameState.players.find(p => p.id === userId);
      if (me?.finished) setMyFinished(true);
      if (me && !me.alive) {
        setMyAlive(false);
        gameRef.current?.events.emit('i_died');
      }

      const remotes = gameState.players.filter(p => p.id !== userId);
      gameRef.current?.events.emit('remote_states', remotes);
      gameRef.current?.events.emit('remote_enemies', gameState.enemies);
    }

    function handleRaceFinished(res: RaceResult) {
      setResult(res);
    }

    function handleRewardEarned(reward: RewardResult) {
      // Émis uniquement au vainqueur de la course (cf. duelHandler.ts#finishRace)
      if (reward.xp_gained > 0) {
        showToastRef.current(translateRef.current('toast_xp_gained', { xp: reward.xp_gained }), 'success');
      }
      reward.achievements_unlocked.forEach((achievement) => {
        showToastRef.current(
          translateRef.current('toast_achievement_unlocked', { name: translateRef.current(`achievement.${ACHIEVEMENT_LABEL[achievement.code]}`) }),
          'success',
        );
      });
      api.auth.getMe().then(updateUserRef.current).catch(() => {
        // The next profile load will refresh XP if this background refresh fails.
      });
    }

    function handleErrorEvent({ message }: { message: string }) {
      console.error('[duel game]', message);
    }

    function handleConnect() {
      duelSocket.emit('join_race', { race_id: currentRaceId });
    }

    duelSocket.on('game_state', handleGameState);
    duelSocket.on('race_finished', handleRaceFinished);
    duelSocket.on('reward_earned', handleRewardEarned);
    duelSocket.on('error_event', handleErrorEvent);
    duelSocket.on('connect', handleConnect);

    // Le socket partagé est peut-être déjà connecté avant ce montage
    // (ex: navigation depuis le lobby) — sans ceci, 'connect' ne se
    // redéclenche jamais et join_race n'est jamais émis.
    if (duelSocket.connected) {
      duelSocket.emit('join_race', { race_id: currentRaceId });
    }

    return () => {
      duelSocket.off('game_state', handleGameState);
      duelSocket.off('race_finished', handleRaceFinished);
      duelSocket.off('reward_earned', handleRewardEarned);
      duelSocket.off('error_event', handleErrorEvent);
      duelSocket.off('connect', handleConnect);
    };
  }, [socket, raceId, userId]);

  // ── Phaser : initialisation ───────────────────────────────────────────────
  useEffect(() => {
    if (!state || !containerRef.current || !user) return;

    const config: Phaser.Types.Core.GameConfig = {
      type:            Phaser.AUTO,
      parent:          containerRef.current,
      width:           CANVAS_W,
      height:          CANVAS_H,
      backgroundColor: '#0d1117',
      pixelArt:        false,
      physics: {
        default: 'arcade',
        arcade:  { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: [],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Phaser → React : input local
    game.events.on('emit_player_input', ({ direction }: { direction: Direction }) => {
      socketRef.current?.emit('player_input', { direction });
    });

    // La scène signale la fin de son create() (textures chargées, listeners
    // enregistrés) — on lui rejoue alors le dernier game_state connu, pour
    // rattraper tout ce qui a pu être émis (et perdu, faute de listener)
    // pendant le chargement des assets.
    game.events.on('scene_ready', () => {
      const gs = lastGameStateRef.current;
      if (!gs) return;
      const remotes = gs.players.filter(p => p.id !== user.id);
      game.events.emit('remote_states', remotes);
      game.events.emit('remote_enemies', gs.enemies);
      const me = gs.players.find(p => p.id === user.id);
      if (me && !me.alive) game.events.emit('i_died');
    });

    game.events.once('ready', () => {
      game.scene.add('DuelScene', DuelScene, true, {
        grid:        state.grid,
        my_id:       user.id,
        my_username: user.username,
        my_sprite:   AVATAR_TO_SPRITE[user.avatar ?? ''] ?? DEFAULT_PLAYER_SPRITE,
        opponents:   state.opponents,
        opponent_sprites: Object.fromEntries(
          state.opponents.map(o => [o.id, AVATAR_TO_SPRITE[o.avatar ?? ''] ?? DEFAULT_PLAYER_SPRITE]),
        ),
      });
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [state, user]);

  const handleDirection = (direction: Direction, pressed: boolean) => {
  gameRef.current?.events.emit('touch_input', { direction, pressed });
  };

  if (!state) return null;

return (
  <div className="min-h-screen bg-surface flex flex-col items-center gap-4 p-4">
    {/* En-tête avec pseudos adversaires */}
    <div className="flex items-center gap-4 text-sm text-white/60 flex-wrap justify-center">
      <span className="text-white font-medium">{user?.username}</span>
      <span className="text-white/30">vs</span>
      {state.opponents.map((o, i) => (
        <span key={o.id} className="text-deep-300 font-medium">
          {o.username}{i < state.opponents.length - 1 ? ',' : ''}
        </span>
      ))}
    </div>

    <p className="text-white/60 text-sm">
      {t('duel_game_page.instructions')}
    </p>

    <div className="w-full flex flex-row items-start justify-center gap-4">
      <ScaledGameFrame
        overlay={
          <>
            {/* Attente que tous les joueurs soient connectés */}
            {waiting && !result && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg gap-3">
                <Spinner size="lg" className="text-deep-400" />
                <p className="text-white/70 text-sm">
                  {t('duel_game_page.wait_other_player')}
                </p>
              </div>
            )}

            {/* Le joueur local a fini, la course continue pour les autres */}
            {!waiting && myFinished && !result && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg gap-3 pointer-events-none">
                <Spinner size="lg" className="text-deep-400" />
                <p className="text-white/70 text-sm">
                  {t('duel_game_page.waiting_others')}
                </p>
              </div>
            )}

            {/* Le joueur local est mort (ennemi/forfait), la course continue pour les autres */}
            {!waiting && !myAlive && !myFinished && !result && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg gap-3 pointer-events-none">
                <p className="text-3xl">💀</p>
                <p className="text-white/70 text-sm">
                  {t('duel_game_page.dead_waiting')}
                </p>
              </div>
            )}

            {result && (
              <ResultOverlay
                result={result}
                myId={user?.id ?? ''}
                onLeave={() => navigate('/duel')}
              />
            )}
          </>
        }
      >
        <div
          ref={containerRef}
          className="rounded-lg overflow-hidden shadow-lg"
          style={{ width: CANVAS_W, height: CANVAS_H }}
        />
      </ScaledGameFrame>

      <Leaderboard
        title={t('leaderboard.map_title')}
        entries={leaderboardEntries}
        loading={leaderboardLoading}
        highlightUserId={user?.id}
        className="w-64 shrink-0 mt-12 hidden md:flex"
      />
    </div>

    {createPortal(<TouchPad onDirection={handleDirection} />, document.body)}
  </div>
);
}
