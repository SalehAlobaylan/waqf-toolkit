/**
 * Known URL tracking parameters stripped by Miftah Link.
 *
 * Each entry documents what it tracks and where it comes from, so the list
 * stays auditable. When adding a parameter, include a source reference.
 *
 * Matching is case-insensitive and applies to query parameters only —
 * fragments (#) and paths are never modified.
 */
export const TRACKER_PARAMS: readonly string[] = [
  // Google Analytics / Ads / Search Console
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_source_platform',
  'utm_creative_format',
  'utm_marketing_tactic',
  'gclid', // Google Ads click id
  'gclsrc', // Google Ads extended
  'dclid', // DoubleClick/Display & Video 360
  'wbraid', // Google web-to-app
  'gbraid', // Google app-to-web

  // Meta / Facebook / Instagram
  'fbclid', // Facebook click id (https://developers.facebook.com/docs/marketing-api/app-event-parameters)
  'igshid', // Instagram share id
  'igsh', // Instagram share link
  'meta_visibility',

  // X / Twitter
  'twclid', // Twitter/X click id

  // TikTok
  'ttclid', // TikTok click id
  '_ttp', // TikTok pixel id

  // LinkedIn
  'li_fat_id', // LinkedIn ad tracking
  'trk', // LinkedIn feed tracking
  'originalSubdomain', // LinkedIn share rewrites

  // Microsoft / Bing
  'msclkid', // Microsoft Advertising click id
  'ocid', // Bing/Browser campaign id
  'cvid', // Bing search session
  'mkt_tok', // Marketo (used by Microsoft mail)

  // Email marketing
  'mc_cid', // Mailchimp campaign
  'mc_eid', // Mailchimp email id
  '_hsenc', // HubSpot
  '_hsmi', // HubSpot
  'vero_id', // Vero
  'wickedid', // Wicked Reports

  // E-commerce / marketplaces
  'ascsubtag', // Amazon affiliate/subtag
  'tag', // Amazon affiliate tag (removed only with other trackers? kept simple: always removed)
  'spm', // AliExpress/Alibaba page tracking
  'scm', // AliExpress/Alibaba funnel tracking
  'aff_platform', // AliExpress affiliate
  'aff_trace_key', // AliExpress affiliate
  'pvid', // Alibaba session
  'scenario', // AliExpress share scenario

  // Misc share/campaign ids
  'yclid', // Yandex Ads
  'srsltid', // Google Merchant/Search result link id
  'ref_src', // News/social referral rewrites
  'ref_url',
  'cmpid', // Generic campaign id
  's_cid', // Adobe Analytics site catalyst
]

