"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useLightningApp } from "~~/hooks/LightningProvider";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  // {
  //   label: "Home",
  //   href: "/",
  // },
  // {
  //   label: "Debug Contracts",
  //   href: "/debug",
  //   icon: <BugAntIcon className="h-4 w-4" />,
  // },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "bg-secondary shadow-md" : ""
              } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { isWebSocketConnected, reconnect } = useLightningApp();
  return (
    <div className="sticky font-mono lg:static top-0 navbar bg-base-100 min-h-0 flex-shrink-0 justify-between z-20 px-0 sm:px-2 ">
      <div className="navbar-start w-auto lg:w-1/2">
        <Link color={"white"} href="/" passHref className="hidden lg:flex items-center gap-2 ml-4 mr-6 shrink-0">
          <Image src="/logo.svg" alt="Botanix Logo" width={"24"} height={"24"} />
          <div className="flex flex-col font-bold text-white">Botanix {"<>"} Lightning </div>
        </Link>
      </div>
      <div className="navbar-end flex-grow mr-4">
        <button
          className="btn btn-ghost btn-sm text-white font-plex"
          onClick={() => {
            if (!isWebSocketConnected) reconnect();
          }}
        >
          <div className={`${isWebSocketConnected ? "bg-success" : "bg-error"} rounded-full w-2 h-2 self-center`}></div>
          {isWebSocketConnected ? "LSP Connected" : "LSP Disconnected"}
        </button>
        &nbsp;
        <RainbowKitCustomConnectButton />
        <FaucetButton />
      </div>
    </div>
  );
};
