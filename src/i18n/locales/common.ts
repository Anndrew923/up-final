import enCore from './en/common/core.json';
import enHome from './en/common/home.json';
import enLadder from './en/common/ladder.json';
import enTools from './en/common/tools.json';
import enAssessment from './en/common/assessment.json';
import enStrength from './en/common/strength.json';
import enGrip from './en/common/grip.json';
import enArmSize from './en/common/armSize.json';
import enExplosive from './en/common/explosive.json';
import enCardio from './en/common/cardio.json';
import enMuscle from './en/common/muscle.json';
import enFfmi from './en/common/ffmi.json';
import enHistory from './en/common/history.json';
import enSettings from './en/common/settings.json';
import enAbout from './en/common/about.json';
import enPrivacy from './en/common/privacy.json';
import enContact from './en/common/contact.json';
import enAuthChoice from './en/common/authChoice.json';
import enOnboarding from './en/common/onboarding.json';
import zhCore from './zh-Hant/common/core.json';
import zhHome from './zh-Hant/common/home.json';
import zhLadder from './zh-Hant/common/ladder.json';
import zhTools from './zh-Hant/common/tools.json';
import zhAssessment from './zh-Hant/common/assessment.json';
import zhStrength from './zh-Hant/common/strength.json';
import zhGrip from './zh-Hant/common/grip.json';
import zhArmSize from './zh-Hant/common/armSize.json';
import zhExplosive from './zh-Hant/common/explosive.json';
import zhCardio from './zh-Hant/common/cardio.json';
import zhMuscle from './zh-Hant/common/muscle.json';
import zhFfmi from './zh-Hant/common/ffmi.json';
import zhHistory from './zh-Hant/common/history.json';
import zhSettings from './zh-Hant/common/settings.json';
import zhAbout from './zh-Hant/common/about.json';
import zhPrivacy from './zh-Hant/common/privacy.json';
import zhContact from './zh-Hant/common/contact.json';
import zhAuthChoice from './zh-Hant/common/authChoice.json';
import zhOnboarding from './zh-Hant/common/onboarding.json';

type CommonLocale = Record<string, unknown>;

type CommonSection = {
  name: string;
  content: CommonLocale;
};

function mergeCommonSections(sections: CommonSection[]): CommonLocale {
  const merged: CommonLocale = {};
  const ownerByKey = new Map<string, string>();
  for (const section of sections) {
    for (const [key, value] of Object.entries(section.content)) {
      const existingOwner = ownerByKey.get(key);
      if (existingOwner != null) {
        throw new Error(
          `Duplicate common key "${key}" found in sections "${existingOwner}" and "${section.name}".`
        );
      }
      ownerByKey.set(key, section.name);
      merged[key] = value;
    }
  }
  return merged;
}

export const enCommon = mergeCommonSections([
  { name: 'core', content: enCore },
  { name: 'home', content: enHome },
  { name: 'ladder', content: enLadder },
  { name: 'tools', content: enTools },
  { name: 'assessment', content: enAssessment },
  { name: 'strength', content: enStrength },
  { name: 'grip', content: enGrip },
  { name: 'armSize', content: enArmSize },
  { name: 'explosive', content: enExplosive },
  { name: 'cardio', content: enCardio },
  { name: 'muscle', content: enMuscle },
  { name: 'ffmi', content: enFfmi },
  { name: 'history', content: enHistory },
  { name: 'settings', content: enSettings },
  { name: 'about', content: enAbout },
  { name: 'privacy', content: enPrivacy },
  { name: 'contact', content: enContact },
  { name: 'authChoice', content: enAuthChoice },
  { name: 'onboarding', content: enOnboarding },
]);

export const zhHantCommon = mergeCommonSections([
  { name: 'core', content: zhCore },
  { name: 'home', content: zhHome },
  { name: 'ladder', content: zhLadder },
  { name: 'tools', content: zhTools },
  { name: 'assessment', content: zhAssessment },
  { name: 'strength', content: zhStrength },
  { name: 'grip', content: zhGrip },
  { name: 'armSize', content: zhArmSize },
  { name: 'explosive', content: zhExplosive },
  { name: 'cardio', content: zhCardio },
  { name: 'muscle', content: zhMuscle },
  { name: 'ffmi', content: zhFfmi },
  { name: 'history', content: zhHistory },
  { name: 'settings', content: zhSettings },
  { name: 'about', content: zhAbout },
  { name: 'privacy', content: zhPrivacy },
  { name: 'contact', content: zhContact },
  { name: 'authChoice', content: zhAuthChoice },
  { name: 'onboarding', content: zhOnboarding },
]);
