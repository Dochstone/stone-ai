import { redirect } from "next/navigation";

interface Props {
  params: { slug: string };
}

export default function AuthorPage({ params }: Props) {
  redirect("/about");
}
