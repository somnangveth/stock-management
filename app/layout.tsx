import { Toaster } from "sonner";
import "./globals.css";
import ReactQueryProvider from "./lib/reactqueryprovider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="">
        <ReactQueryProvider>
          {children}


        <Toaster
          position="top-right"
          toastOptions={{
            className: "border shadow-lg rounded-lg",
            style: {
              backgroundColor: "white",
              color: "#374151",
            },
          }}
        />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
