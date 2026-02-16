export const SITE = {
  website: "https://elaichenkov.github.io/",
  author: "Yevhen Laichenkov",
  profile: "https://github.com/elaichenkov",
  desc: "I share what I've seen, learned, and messed up in life, testing, and software.",
  title: "Yevhen's Blog",
  ogImage: "",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: true,
    text: "Suggest an edit",
    url: "https://github.com/elaichenkov/elaichenkov.github.io/edit/main/",
  },
  dynamicOgImage: true,
  posthog: {
    enabled: true,
    key: "phc_z8BQQAXpczV4aNQQ9OKJhN977vZLcBQ0AUEMKhigRVk",
    apiHost: "https://us.i.posthog.com",
    defaults: "2026-01-30",
  },
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "UTC", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
