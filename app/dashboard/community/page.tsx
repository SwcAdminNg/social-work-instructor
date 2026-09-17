import CommunityContainer from "@/components/dashboard/community/CommunityContainer";

export default function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return <CommunityContainer searchParams={searchParams} />;
}
