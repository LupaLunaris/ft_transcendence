import Button from '../components/Button';
import Card from '../components/Card';

export default function LoginPage() {
  return (
    <Card title="Login">
      <form>
        <label htmlFor="username">Username</label>
        <input id="username" name="username" type="text" autoComplete="username" />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" />

        <Button type="submit">Sign in</Button>
      </form>
    </Card>
  );
}
