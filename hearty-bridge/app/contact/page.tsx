import { redirect } from "next/navigation";

// All public content now lives on the single-page landing (`/`) .
// Keep this route as a redirect so existing links (footer, CTA, bookmarks)
// land on the correct section instead of a broken page.
export default function ContactPage() {
  redirect("/#contact");
}
