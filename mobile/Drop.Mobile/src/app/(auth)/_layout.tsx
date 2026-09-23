import { Stack } from 'expo-router';

// No auto-redirect when authenticated: each auth screen navigates itself on
// success (business sign-up lands on the business panel, not the feed), and
// the root index route handles the initial redirect.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
