import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-24 text-center">
      <h2 className="text-2xl font-bold text-neutral-heading">Page Not Found</h2>
      <p className="mt-2 text-neutral-secondary">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/">
        <Button className="mt-6">Back to Home</Button>
      </Link>
    </div>
  );
}
