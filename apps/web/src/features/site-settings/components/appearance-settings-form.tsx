"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Contact,
  Globe2,
  ImageIcon,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Share2,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { parseAsStringEnum, useQueryState } from "nuqs";
import * as React from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldPath,
} from "react-hook-form";
import { toast } from "sonner";

import { ManagedImagePicker } from "@/components/media/managed-image-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { updateAppearanceSettings } from "@/features/site-settings/api/appearance.client";
import {
  appearanceSettingsSchema,
  type AppearanceSettingsValues,
} from "@/features/site-settings/schemas/appearance-schema";
import {
  appearanceTabs,
  socialPlatforms,
  type AdminWebsiteSettings,
  type SiteMedia,
} from "@/features/site-settings/types";
import type { ManagedFileDto } from "@/lib/api-client";

const platformLabels = {
  facebook: "Facebook",
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  linkedin: "LinkedIn",
  github: "GitHub",
  discord: "Discord",
  telegram: "Telegram",
  zalo: "Zalo",
} as const;

type MediaField =
  | "logoLightId"
  | "logoDarkId"
  | "logoIconId"
  | "faviconId"
  | "defaultOgImageId";
type MediaState = Record<MediaField, SiteMedia | null>;

export function AppearanceSettingsForm({
  initialSettings,
  canUpdate,
}: {
  initialSettings: AdminWebsiteSettings;
  canUpdate: boolean;
}) {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringEnum([...appearanceTabs]).withDefault("general").withOptions({
      history: "push",
      shallow: true,
    }),
  );
  const [pickerField, setPickerField] = React.useState<MediaField | null>(null);
  const [savedSettings, setSavedSettings] = React.useState(initialSettings);
  const [submitError, setSubmitError] = React.useState("");
  const [media, setMedia] = React.useState<MediaState>(() =>
    mediaFromSettings(initialSettings),
  );
  const form = useForm<AppearanceSettingsValues>({
    resolver: zodResolver(appearanceSettingsSchema),
    defaultValues: valuesFromSettings(initialSettings),
  });
  const [previewSiteName, previewTagline, previewDescription] = useWatch({
    control: form.control,
    name: ["siteName", "siteTagline", "siteDescription"],
  });
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "socialLinks",
  });

  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!form.formState.isDirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    const handleNavigation = (event: MouseEvent) => {
      if (!form.formState.isDirty) return;
      const target = event.target;
      const anchor =
        target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.target === "_blank") return;
      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin === window.location.origin &&
        destination.pathname === window.location.pathname
      ) {
        return;
      }
      if (!window.confirm("Bạn có thay đổi chưa lưu. Vẫn rời khỏi trang?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", handleNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleNavigation, true);
    };
  }, [form.formState.isDirty]);

  async function onSubmit(values: AppearanceSettingsValues) {
    try {
      setSubmitError("");
      const updated = await updateAppearanceSettings({
        ...values,
        socialLinks: values.socialLinks.map((link, index) => ({
          ...link,
          sortOrder: index,
        })),
      });
      form.reset(valuesFromSettings(updated));
      setSavedSettings(updated);
      setMedia(mediaFromSettings(updated));
      toast.success("Đã lưu cài đặt website.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể lưu cài đặt.";
      setSubmitError(message);
      toast.error(message);
    }
  }

  function resetForm() {
    if (form.formState.isDirty && !window.confirm("Bỏ toàn bộ thay đổi chưa lưu?")) {
      return;
    }
    form.reset(valuesFromSettings(savedSettings));
    setMedia(mediaFromSettings(savedSettings));
    setSubmitError("");
  }

  function chooseMedia(field: MediaField, file: ManagedFileDto) {
    form.setValue(field, file.id, { shouldDirty: true, shouldValidate: true });
    setMedia((current) => ({
      ...current,
      [field]: {
        id: file.id,
        alias: file.alias,
        name: file.name,
        mimeType: file.mimeType,
        extension: file.extension,
        downloadUrl: `/api/site-assets/${file.id}`,
      },
    }));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={tab} onValueChange={(value) => void setTab(value as typeof tab)}>
          <div className="overflow-x-auto border-b">
            <TabsList variant="line" className="min-w-max">
              <TabsTrigger value="general"><Globe2 /> Thông tin chung</TabsTrigger>
              <TabsTrigger value="branding"><ImageIcon /> Nhận diện</TabsTrigger>
              <TabsTrigger value="social"><Share2 /> Mạng xã hội</TabsTrigger>
              <TabsTrigger value="contact"><Contact /> Liên hệ</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="mt-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin website</CardTitle>
                  <CardDescription>
                    Dùng cho tiêu đề trình duyệt, metadata mặc định và nhận diện công khai.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5">
                  <TextField control={form.control} name="siteName" label="Tên website" required />
                  <TextField
                    control={form.control}
                    name="siteShortName"
                    label="Tên rút gọn"
                    description="Tên ngắn dùng khi không đủ không gian hiển thị."
                  />
                  <TextField control={form.control} name="siteTagline" label="Tagline" />
                  <TextField
                    control={form.control}
                    name="siteUrl"
                    label="URL chính thức"
                    placeholder="https://example.com"
                    description="Dùng làm metadataBase và canonical origin. Không chứa secret."
                  />
                  <TextAreaField
                    control={form.control}
                    name="siteDescription"
                    label="Mô tả website"
                    rows={5}
                  />
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Xem trước nhận diện</CardTitle>
                  <CardDescription>Dữ liệu đang nhập, chưa cần lưu.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border bg-background p-5">
                    <div className="flex items-center gap-3">
                      {media.logoLightId ? (
                        <Image
                          src={media.logoLightId.downloadUrl}
                          alt=""
                          width={44}
                          height={44}
                          unoptimized
                          className="size-11 rounded-lg object-contain"
                        />
                      ) : (
                        <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
                          <Building2 />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {previewSiteName || "Tên website"}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {previewTagline || "Tagline của website"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {previewDescription || "Mô tả website sẽ hiển thị tại đây."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="branding" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <MediaCard
                title="Logo nền sáng"
                description="Logo chính trên nền sáng. Khuyên dùng PNG/WebP trong suốt."
                field="logoLightId"
                file={media.logoLightId}
                onChoose={setPickerField}
                onRemove={(field) => removeMedia(field, form, setMedia)}
              />
              <MediaCard
                title="Logo nền tối"
                description="Logo thay thế trên nền tối."
                field="logoDarkId"
                file={media.logoDarkId}
                dark
                onChoose={setPickerField}
                onRemove={(field) => removeMedia(field, form, setMedia)}
              />
              <MediaCard
                title="Logo icon"
                description="Biểu tượng vuông cho không gian nhỏ và touch icon."
                field="logoIconId"
                file={media.logoIconId}
                onChoose={setPickerField}
                onRemove={(field) => removeMedia(field, form, setMedia)}
              />
              <MediaCard
                title="Favicon"
                description="Khuyên dùng ảnh vuông PNG hoặc ICO."
                field="faviconId"
                file={media.faviconId}
                onChoose={setPickerField}
                onRemove={(field) => removeMedia(field, form, setMedia)}
              />
              <div className="lg:col-span-2">
                <MediaCard
                  title="Ảnh Open Graph mặc định"
                  description="Ảnh chia sẻ mặc định; khuyên dùng tỷ lệ 1200 × 630."
                  field="defaultOgImageId"
                  file={media.defaultOgImageId}
                  wide
                  onChoose={setPickerField}
                  onRemove={(field) => removeMedia(field, form, setMedia)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Liên kết mạng xã hội</CardTitle>
                <CardDescription>
                  Chỉ các liên kết bật trạng thái mới xuất hiện ở khu vực public.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    Chưa có liên kết mạng xã hội.
                  </div>
                ) : null}
                {fields.map((field, index) => (
                  <div key={field.id} className="grid gap-4 rounded-xl border p-4 lg:grid-cols-[180px_minmax(0,1fr)_auto]">
                    <FormField
                      control={form.control}
                      name={`socialLinks.${index}.platform`}
                      render={({ field: input }) => (
                        <FormItem>
                          <FormLabel>Nền tảng</FormLabel>
                          <Select value={input.value} onValueChange={input.onChange}>
                            <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {socialPlatforms.map((platform) => (
                                <SelectItem key={platform} value={platform}>
                                  {platformLabels[platform]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <TextField
                      control={form.control}
                      name={`socialLinks.${index}.url`}
                      label="URL HTTPS"
                      placeholder="https://..."
                    />
                    <div className="flex items-end gap-1">
                      <FormField
                        control={form.control}
                        name={`socialLinks.${index}.isActive`}
                        render={({ field: input }) => (
                          <FormItem className="mr-2 flex h-9 items-center gap-2 rounded-md border px-3">
                            <FormControl><Switch checked={input.value} onCheckedChange={input.onChange} /></FormControl>
                            <FormLabel className="whitespace-nowrap">Hiển thị</FormLabel>
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="outline" size="icon" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label="Đưa lên"><ArrowUp /></Button>
                      <Button type="button" variant="outline" size="icon" disabled={index === fields.length - 1} onClick={() => move(index, index + 1)} aria-label="Đưa xuống"><ArrowDown /></Button>
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} aria-label="Xóa"><Trash2 /></Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  disabled={fields.length >= socialPlatforms.length}
                  onClick={() => {
                    const used = new Set(form.getValues("socialLinks").map((link) => link.platform));
                    const platform = socialPlatforms.find((item) => !used.has(item));
                    if (platform) append({ platform, url: "", isActive: true, sortOrder: fields.length });
                  }}
                >
                  <Plus /> Thêm liên kết
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin liên hệ</CardTitle>
                <CardDescription>
                  Dữ liệu công khai có thể được dùng ở footer và các trang hỗ trợ.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <TextField control={form.control} name="contactEmail" label="Email liên hệ" type="email" />
                <TextField control={form.control} name="supportEmail" label="Email hỗ trợ" type="email" />
                <TextField control={form.control} name="phone" label="Số điện thoại" />
                <TextField control={form.control} name="workingHours" label="Giờ làm việc" />
                <div className="md:col-span-2">
                  <TextAreaField control={form.control} name="address" label="Địa chỉ" rows={3} />
                </div>
                <div className="md:col-span-2">
                  <TextField
                    control={form.control}
                    name="mapUrl"
                    label="URL bản đồ"
                    placeholder="https://maps.google.com/..."
                    description="Chỉ lưu URL HTTPS; không nhận iframe hoặc HTML embed."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
          <p className={submitError ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
            {submitError || (form.formState.isDirty ? "Có thay đổi chưa lưu." : "Mọi thay đổi đã được lưu.")}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={resetForm} disabled={form.formState.isSubmitting}>
              <RotateCcw /> Khôi phục
            </Button>
            <Button type="submit" disabled={!canUpdate || form.formState.isSubmitting || !form.formState.isDirty}>
              {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </form>

      <ManagedImagePicker
        open={pickerField !== null}
        onOpenChange={(open) => {
          if (!open) setPickerField(null);
        }}
        selectedFileId={pickerField ? form.getValues(pickerField) : null}
        title="Chọn ảnh nhận diện"
        onSelect={(file) => {
          if (pickerField) chooseMedia(pickerField, file);
          setPickerField(null);
        }}
      />
    </Form>
  );
}

function TextField<TName extends FieldPath<AppearanceSettingsValues>>({
  control,
  name,
  label,
  description,
  required,
  ...inputProps
}: {
  control: Control<AppearanceSettingsValues>;
  name: TName;
  label: string;
  description?: string;
  required?: boolean;
} & Omit<React.ComponentProps<typeof Input>, "name" | "defaultValue">) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}{required ? " *" : ""}</FormLabel>
          <FormControl><Input {...inputProps} {...field} value={typeof field.value === "string" ? field.value : ""} /></FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TextAreaField<TName extends FieldPath<AppearanceSettingsValues>>({
  control,
  name,
  label,
  rows,
}: {
  control: Control<AppearanceSettingsValues>;
  name: TName;
  label: string;
  rows: number;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl><Textarea {...field} value={typeof field.value === "string" ? field.value : ""} rows={rows} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function MediaCard({
  title,
  description,
  field,
  file,
  dark,
  wide,
  onChoose,
  onRemove,
}: {
  title: string;
  description: string;
  field: MediaField;
  file: SiteMedia | null;
  dark?: boolean;
  wide?: boolean;
  onChoose: (field: MediaField) => void;
  onRemove: (field: MediaField) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`grid place-items-center overflow-hidden rounded-xl border ${wide ? "aspect-[1200/630]" : "aspect-[3/1]"} ${dark ? "bg-slate-950" : "bg-muted/30"}`}>
          {file ? (
            <Image src={file.downloadUrl} alt={file.name} width={wide ? 1200 : 600} height={wide ? 630 : 200} unoptimized className="size-full object-contain p-4" />
          ) : (
            <div className="text-center text-sm text-muted-foreground"><ImageIcon className="mx-auto mb-2" />Chưa chọn ảnh</div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => onChoose(field)}><Upload /> Chọn từ Media Manager</Button>
          {file ? <Button type="button" variant="ghost" onClick={() => onRemove(field)}><Trash2 /> Bỏ ảnh</Button> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function valuesFromSettings(settings: AdminWebsiteSettings): AppearanceSettingsValues {
  return {
    siteName: settings.siteName,
    siteShortName: settings.siteShortName ?? "",
    siteDescription: settings.siteDescription ?? "",
    siteTagline: settings.siteTagline ?? "",
    siteUrl: settings.siteUrl ?? "",
    logoLightId: settings.logoLightId,
    logoDarkId: settings.logoDarkId,
    logoIconId: settings.logoIconId,
    faviconId: settings.faviconId,
    defaultOgImageId: settings.defaultOgImageId,
    socialLinks: settings.socialLinks,
    contactEmail: settings.contactEmail ?? "",
    supportEmail: settings.supportEmail ?? "",
    phone: settings.phone ?? "",
    address: settings.address ?? "",
    workingHours: settings.workingHours ?? "",
    mapUrl: settings.mapUrl ?? "",
  };
}

function mediaFromSettings(settings: AdminWebsiteSettings): MediaState {
  return {
    logoLightId: settings.branding.logoLight,
    logoDarkId: settings.branding.logoDark,
    logoIconId: settings.branding.logoIcon,
    faviconId: settings.branding.favicon,
    defaultOgImageId: settings.branding.defaultOgImage,
  };
}

function removeMedia(
  field: MediaField,
  form: ReturnType<typeof useForm<AppearanceSettingsValues>>,
  setMedia: React.Dispatch<React.SetStateAction<MediaState>>,
) {
  form.setValue(field, null, { shouldDirty: true, shouldValidate: true });
  setMedia((current) => ({ ...current, [field]: null }));
}
