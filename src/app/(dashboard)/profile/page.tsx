import { getProfileData } from "./actions";
import { ProfileClient } from "@/components/profile/profile-client";

export default async function ProfilePage() {
  const data = await getProfileData();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Your account details
        </p>
      </div>

      <ProfileClient
        user={data.user}
        stats={data.stats}
        providers={data.providers}
      />
    </div>
  );
}
