"use client";

import UserProfilePage from "@/components/profile/UserProfileView";
import { useParams } from "next/navigation";
import AboutUser from "@/components/profile/AboutUser";

export default function Page() {
    const params = useParams();
    const user_id = params.user_id as string;

    return (
        <>
        <div className="min-h-screen">
            <UserProfilePage user_id={user_id} />
            <AboutUser />
        </div>
            
        </>
    );
}
