import HomeLadderIdentitySection from '../components/home/HomeLadderIdentitySection';
import HomeProFeatureCard from '../components/home/HomeProFeatureCard';
import HomeProfileForm from '../components/home/HomeProfileForm';
import HomeRadarBoard from '../components/home/HomeRadarBoard';

/**
 * Console home: radar-first, Pro value card, then baseline profile + ladder identity.
 * WHY: Genesis ladder seats must still surface Dyno / Cloud Sync upgrade delta under the radar.
 */
export default function HomePage() {
  return (
    // WHY ui-shell-compact: gutters only. AppShell gives Home full `pt-shell-top` so the radar
    // clears the fixed HUD (compact scroll inset caused the iOS stepped clip under PRO).
    <main className="ui-shell-compact max-w-4xl space-y-4 pb-6 md:pb-8">
      {/* Tighter section rhythm — radar board owns the first viewport under full shell-top. */}
      <section>
        <HomeRadarBoard />
      </section>

      <HomeProFeatureCard />

      {/* Profile stays below radar; collapses once baseline is complete (radar-first density). */}
      <HomeProfileForm />

      <HomeLadderIdentitySection />
    </main>
  );
}
