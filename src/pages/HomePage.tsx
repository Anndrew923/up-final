import HomeLadderIdentitySection from '../components/home/HomeLadderIdentitySection';
import HomeProfileForm from '../components/home/HomeProfileForm';
import HomeRadarBoard from '../components/home/HomeRadarBoard';

/**
 * Console home: radar-first, then baseline profile + ladder identity.
 * Leaderboard entry / entitlement gates live on the Ladder tab + Join Arena — not duplicated here.
 */
export default function HomePage() {
  return (
    <main className="ui-shell-compact max-w-4xl space-y-4 pb-6 md:pb-8">
      {/* Compact shell + tighter section rhythm — radar board owns the first viewport. */}
      <section>
        <HomeRadarBoard />
      </section>

      {/* Profile stays below radar; collapses once baseline is complete (radar-first density). */}
      <HomeProfileForm />

      <HomeLadderIdentitySection />
    </main>
  );
}
