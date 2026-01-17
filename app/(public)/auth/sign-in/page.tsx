import { Suspense } from "react"
import { SignInForm } from "./_components/sign-in-form"

interface SignInPageProps {
  searchParams: Promise<{ message?: string }>
}

async function SignInFormWithMessage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams
  return <SignInForm message={message} />
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  return (
    <div className="w-full max-w-sm">
      <Suspense fallback={<SignInForm />}>
        <SignInFormWithMessage searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
