import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CommentSection from "@/components/web/CommentSection";
import PostPresence from "@/components/web/PostPresence";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getToken } from "@/lib/auth-server";
import { fetchQuery, preloadQuery } from "convex/nextjs";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

interface PostIdRouteProps {
  params: Promise<{ postId: Id<"posts"> }>;
}

export const generateMetadata = async ({
  params,
}: PostIdRouteProps): Promise<Metadata> => {
  const { postId } = await params;

  const token = await getToken();

  const post = await fetchQuery(api.post.getPostById, { postId: postId });

  if (!post) {
    return {
      title: "Post not found",
    };
  }

  return {
    title: post.title,
    description: post.body,
  };
};

const PostIdRoute = async ({ params }: PostIdRouteProps) => {
  const { postId } = await params;

  const token = await getToken();

  const [post, preloadedComments, userId] = await Promise.all([
    await fetchQuery(api.post.getPostById, { postId: postId }),
    await preloadQuery(api.comments.getCommentsByPostId, {
      postId: postId,
    }),
    await fetchQuery(api.presence.getUserId, {}, { token }),
  ]);

  if (!userId) {
    return redirect("/auth/login");
  }

  if (!post) {
    return (
      <div>
        <h1 className="text-6xl font-extrabold text-red-500 p-20">
          No post found
        </h1>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in duration-500 relative">
      <Link
        className={buttonVariants({ variant: "outline", className: "mb-4" })}
        href="/blog"
      >
        <ArrowLeft className="size-4" />
        Back to blog
      </Link>

      <div className="relative w-full h-[400px] mb-8 rounded-xl overflow-hidden shadow-sm">
        <Image
          src={
            post.imageUrl ??
            "https://static.vecteezy.com/system/resources/previews/007/233/800/non_2x/sea-beach-and-rocky-mountains-in-tropical-evening-photo.jpg"
          }
          alt={post.title}
          fill
          className="object-cover hover:scale-105 tracking-transform duration-500"
        />
      </div>

      <div className="space-y-4 flex flex-col">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {post.title}
        </h1>

        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Posted on:{" "}
            {new Date(post._creationTime).toLocaleDateString("ru-RU")}
          </p>
          {userId && <PostPresence roomId={post._id} userId={userId} />}
        </div>

        <Separator className="my-8" />

        <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {post.body}
        </p>

        <Separator className="my-8" />

        <CommentSection preloadedComments={preloadedComments} />
      </div>
    </div>
  );
};

export default PostIdRoute;
