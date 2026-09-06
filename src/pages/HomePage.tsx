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
    <main className="ui-shell-compact max-w-4xl space-y-4 pb-6 md:pb-8">
      {/* Compact shell + tighter section rhythm — radar board owns the first viewport. */}
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
