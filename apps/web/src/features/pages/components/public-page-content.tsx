import type { PublicPage } from "@/features/pages/types";

type PublicPageContentData = Pick<
  PublicPage,
  "title" | "excerpt" | "contentHtml" | "featuredImage"
>;

export function PublicPageContent({ page }: { page: PublicPageContentData }) {
  return (
    <article className="bg-background text-foreground">
      <header className="border-b border-border py-12 sm:py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[720px] px-4 sm:px-6">
          <h1 className="type-page-title text-balance">{page.title}</h1>
          {page.excerpt ? (
            <p className="type-lead mt-5 text-pretty text-foreground/75">
              {page.excerpt}
            </p>
          ) : null}
        </div>
      </header>
      {page.featuredImage?.url ? (
        <div className="mx-auto w-full max-w-[1120px] px-4 pt-10 sm:px-6 sm:pt-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.featuredImage.url}
            alt={page.featuredImage.fileName || page.title}
            className="aspect-[16/7] w-full rounded-xl border border-border object-cover"
          />
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-[720px] px-4 py-12 sm:px-6 sm:py-16">
        <div
          className="type-body max-w-none text-foreground/90 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-5 [&_blockquote]:text-foreground/75 [&_h1]:mb-4 [&_h1]:mt-10 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h2]:mb-3 [&_h2]:mt-9 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mb-2 [&_h4]:mt-7 [&_h4]:text-lg [&_h4]:font-semibold [&_hr]:my-10 [&_hr]:border-border [&_img]:my-8 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-border [&_li]:my-1.5 [&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:gap-2 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-5 [&_pre]:my-6 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:p-4 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0"
          dangerouslySetInnerHTML={{ __html: page.contentHtml }}
        />
      </div>
    </article>
  );
}
