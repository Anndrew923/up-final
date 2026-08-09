export const ABOUT_PORTRAITS = {
  founder: '/images/about/founder.jpg',
  advisor1: '/images/about/advisor1.jpg',
  advisor2: '/images/about/advisor2.jpg',
} as const;

export const ADVISOR_PORTRAIT_BY_INDEX = [
  ABOUT_PORTRAITS.advisor1,
  ABOUT_PORTRAITS.advisor2,
] as const;
