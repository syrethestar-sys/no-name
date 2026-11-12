import { redirect } from 'next/navigation';

// One form handles both: it creates the account when the email is new.
export default function SignUpPage() {
  redirect('/sign-in');
}
