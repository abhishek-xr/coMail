// /api/aurinko/callback
import { exchangeCodeForAccessToken, getAccountDetails } from "@/lib/aurinko"
import { db } from "@/server/db"
import {auth} from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "node_modules/next/server"


export const GET = async(req : NextRequest) => {
    const {userId} = await auth()

    if(!userId) return NextResponse.json({message:'Unauthorised'}, {status: 401})

    const params = req.nextUrl.searchParams

    //getting code to exchange for auth token
    const code = params.get('code')
    if(!code) return NextResponse.json({message:'No code provided'}, {status:400})
    const token = await exchangeCodeForAccessToken(code)
    if(!token) return NextResponse.json({message:'Failed to exchange code for access token'}, {status: 401})

    const accountDetails = await getAccountDetails(token.accessToken)
    // console.log(accountDetails)

    await db.account.upsert({
        where : {
            id : token.accountId.toString()
        },
        update : {
            accessToken : token.accessToken,
        },
        create: {
            id: token.accountId.toString(),
            userId,
            emailAddress : accountDetails.email,
            name : accountDetails.name,
            accessToken : token.accessToken,
        }
    })

    console.log('userId is ', userId)
    return NextResponse.redirect(new URL('/mail', req.url))
}