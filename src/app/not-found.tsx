import { HomeLink, MessageState } from '@/components/common/states';

export default function NotFound() {
  return (
    <MessageState
      title="Page not found"
      description="The page you're looking for doesn't exist."
      action={<HomeLink />}
    />
  );
}
