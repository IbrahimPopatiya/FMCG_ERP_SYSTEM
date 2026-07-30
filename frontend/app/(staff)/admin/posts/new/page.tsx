"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { PostForm } from "@/components/posts/PostForm";
import { useCreatePost } from "@/lib/hooks/usePostMutations";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

export default function NewPostPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const router = useRouter();
  const createPost = useCreatePost();

  return (
    <div>
      <TopBar title="Create Post" subtitle="Add New Product Post" backHref="/admin/posts" />

      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <PostForm
          onSubmit={async (payload) => {
            const post = await createPost.mutateAsync(payload);
            router.push("/admin/posts");
            return post;
          }}
        />
      </div>
    </div>
  );
}
