/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* index.ts                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jdebrull <jdebrull@student.42be              +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jdebrull        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jdebrull       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { Router } from 'express';
import authRouter from './auth.routes';
import mapsRouter from './maps.routes';
import towerRouter from './tower.routes';
import scoresRouter from './scores.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/maps', mapsRouter);
router.use('/tower', towerRouter);
router.use('/scores', scoresRouter);

export default router;
