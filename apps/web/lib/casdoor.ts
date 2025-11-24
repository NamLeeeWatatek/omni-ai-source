import Sdk from 'casdoor-js-sdk'

const sdkConfig = {
    serverUrl: process.env.NEXT_PUBLIC_CASDOOR_ENDPOINT || '',
    clientId: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID || '',
    appName: process.env.NEXT_PUBLIC_CASDOOR_APP_NAME || '',
    organizationName: process.env.NEXT_PUBLIC_CASDOOR_ORG_NAME || '',
    redirectPath: '/callback',
    signinPath: '/signin',
}

export const casdoorSdk = new Sdk(sdkConfig)

export const getCasdoorSignInUrl = () => {
    return casdoorSdk.getSigninUrl()
}
