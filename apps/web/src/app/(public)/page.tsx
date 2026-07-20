import { LandingPage } from "@/components/landing/landing-page";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";

export default async function Home() {
  const settings = await getPublicSiteSettings();
  return <LandingPage settings={settings} />;
}
