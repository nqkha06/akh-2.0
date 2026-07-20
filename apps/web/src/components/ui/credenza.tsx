"use client"

import * as React from "react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

const MOBILE_BREAKPOINT = 768

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const update = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    update()
    mediaQuery.addEventListener("change", update)
    return () => mediaQuery.removeEventListener("change", update)
  }, [])

  return isMobile
}

type CredenzaRootProps = {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type CredenzaPartProps = {
  children?: React.ReactNode
  className?: string
  [key: string]: unknown
}

const CredenzaContext = React.createContext({ isMobile: false })

function useCredenza() {
  return React.useContext(CredenzaContext)
}

function Credenza({ children, ...props }: CredenzaRootProps) {
  const isMobile = useIsMobile()
  const Root = isMobile ? Drawer : Dialog

  return (
    <CredenzaContext.Provider value={{ isMobile }}>
      <Root {...props}>{children}</Root>
    </CredenzaContext.Provider>
  )
}

function CredenzaTrigger({ children, ...props }: CredenzaPartProps) {
  const { isMobile } = useCredenza()
  const Trigger = isMobile ? DrawerTrigger : DialogTrigger
  return <Trigger {...props}>{children}</Trigger>
}

function CredenzaClose({ children, ...props }: CredenzaPartProps) {
  const { isMobile } = useCredenza()
  const Close = isMobile ? DrawerClose : DialogClose
  return <Close {...props}>{children}</Close>
}

function CredenzaContent({ className, children, ...props }: CredenzaPartProps) {
  const { isMobile } = useCredenza()
  const Content = isMobile ? DrawerContent : DialogContent

  return (
    <Content
      {...(props as React.ComponentProps<typeof DialogContent>)}
      className={cn(
        "flex flex-col overflow-hidden p-0",
        isMobile
          ? "max-h-[92dvh] rounded-t-2xl"
          : "max-h-[min(90dvh,860px)] sm:max-w-3xl",
        className,
      )}
    >
      {children}
    </Content>
  )
}

function CredenzaHeader({ className, ...props }: CredenzaPartProps) {
  const { isMobile } = useCredenza()
  const Header = isMobile ? DrawerHeader : DialogHeader
  return <Header {...props} className={cn("px-5 py-4", className)} />
}

function CredenzaTitle({ className, ...props }: CredenzaPartProps) {
  const { isMobile } = useCredenza()
  const Title = isMobile ? DrawerTitle : DialogTitle
  return <Title {...props} className={cn("text-left", className)} />
}

function CredenzaDescription({ className, ...props }: CredenzaPartProps) {
  const { isMobile } = useCredenza()
  const Description = isMobile ? DrawerDescription : DialogDescription
  return <Description {...props} className={cn("text-sm text-muted-foreground", className)} />
}

function CredenzaBody({ className, ...props }: CredenzaPartProps) {
  return (
    <div
      {...props}
      className={cn("min-h-0 flex-1 overflow-y-auto px-5 pb-5", className)}
    />
  )
}

function CredenzaFooter({ className, ...props }: CredenzaPartProps) {
  const { isMobile } = useCredenza()
  const Footer = isMobile ? DrawerFooter : DialogFooter
  return <Footer {...props} className={cn("border-t border-slate-200 bg-white px-5 py-4", className)} />
}

export {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
}
