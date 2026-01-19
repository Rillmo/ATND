import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import EventCreateForm from "@/components/EventCreateForm";

export default async function EventCreatePage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { orgId } = await params;

  return (
    <div className="mx-auto max-w-2xl">
      <EventCreateForm orgId={orgId} />
    </div>
  );
}
