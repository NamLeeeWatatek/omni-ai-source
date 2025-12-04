/**
 * Platform Utilities
 * Centralized utilities for platform icons and colors
 */
import {
  FiFacebook,
  FiInstagram,
  FiMessageCircle,
  FiMail,
  FiYoutube,
  FiTwitter,
  FiLinkedin,
  FiSlack,
  FiGlobe,
  FiPhone
} from 'react-icons/fi'
import {
  FaWhatsapp,
  FaTelegram,
  FaFacebookMessenger,
  FaTiktok,
  FaDiscord,
  FaShopify,
  FaGoogle,
  FaLine,
  FaViber,
  FaWeixin
} from 'react-icons/fa'
import {
  SiZalo,
  SiNotion,
  SiAirtable,
  SiZapier,
  SiHubspot,
  SiSalesforce,
  SiMailchimp,
  SiIntercom
} from 'react-icons/si'

/**
 * Get platform icon component
 * Returns the icon component class that can be used in JSX
 */
export function getPlatformIcon(type: string): any {
  const iconMap: Record<string, any> = {
    facebook: FiFacebook,
    messenger: FaFacebookMessenger,
    instagram: FiInstagram,
    whatsapp: FaWhatsapp,
    telegram: FaTelegram,
    email: FiMail,
    youtube: FiYoutube,
    twitter: FiTwitter,
    linkedin: FiLinkedin,
    tiktok: FaTiktok,
    discord: FaDiscord,
    slack: FiSlack,
    zalo: SiZalo,
    line: FaLine,
    viber: FaViber,
    wechat: FaWeixin,
    sms: FiPhone,
    webchat: FiGlobe,
    shopify: FaShopify,
    google: FaGoogle,
    hubspot: SiHubspot,
    salesforce: SiSalesforce,
    mailchimp: SiMailchimp,
    intercom: SiIntercom,
    zapier: SiZapier,
    notion: SiNotion,
    airtable: SiAirtable
  }

  return iconMap[type] || FiMessageCircle
}

/**
 * Get platform color classes (uses globals.css platform-* classes)
 */
export function getPlatformColor(type: string): string {
  const validPlatforms = [
    'facebook',
    'messenger',
    'instagram',
    'whatsapp',
    'telegram',
    'youtube',
    'twitter',
    'linkedin',
    'tiktok',
    'discord',
    'slack',
    'zalo',
    'line',
    'viber',
    'wechat',
    'sms',
    'email',
    'webchat',
    'shopify',
    'google',
    'hubspot',
    'salesforce',
    'mailchimp',
    'intercom',
    'zapier',
    'notion',
    'airtable'
  ]

  return validPlatforms.includes(type) ? `platform-${type}` : 'platform-default'
}
