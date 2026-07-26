import { redirect } from "next/navigation";

export default async function ThreadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  redirect("/?tab=" + params.id);
}