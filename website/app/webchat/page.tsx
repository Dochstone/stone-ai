import { redirect } from "next/navigation";

export default function WebChatRedirect({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const params = new URLSearchParams();
  if (searchParams.model) params.set("model", searchParams.model);
  if (searchParams.category) params.set("category", searchParams.category);
  if (searchParams.ref) params.set("ref", searchParams.ref);
  const query = params.toString();
  redirect(`/studio${query ? `?${query}` : ""}`);
}
