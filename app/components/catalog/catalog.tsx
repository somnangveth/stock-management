"use client";
import { Admin, Staff } from "@/type/membertype";
import { ProductBatch } from "@/type/productbatch";
import { Product, Vendors } from "@/type/producttype";
import { useState } from "react";

export default function CatalogRow({
  product,
  admin,
  staff,
  vendor,
  batch,
  style,
  hasImage = false,
}: {
  product?: Product;
  admin?: Admin;
  staff?: Staff;
  vendor?: Vendors;
  batch?: ProductBatch;
  style: string;
  hasImage: boolean;
}) {
  const [isBatch, setIsBatch] = useState(hasImage);

  const text = 'text-sm text-gray-500'
  return (
    <tr className="border border-gray-300 p-2 bg-white">
      {isBatch ? (
        <>
          <td className={text}>{batch?.batch_number}</td>
          <td className={text}>{batch?.manufacture_date ? String(batch.manufacture_date) : "N/A"}</td>
          <td className={text}>{batch?.expiry_date ? String(batch.expiry_date) : "N/A"}</td>
          <td className={text}>{batch?.recieved_date ? String(batch.recieved_date) : "N/A"}</td>
          <td className={text}>{batch?.quantity_remaining ?? 0}</td>
        </>
      ) : (
        <>
          {/* IMAGE CELL */}
          <td>
            {product?.product_image ||
            admin?.profile_image ||
            staff?.profile_image ||
            vendor?.vendor_image ? (
              <img
                src={
                  product?.product_image ||
                  admin?.profile_image ||
                  staff?.profile_image ||
                  vendor?.vendor_image
                }
                alt={
                  product?.product_name ||
                  admin?.first_name ||
                  staff?.first_name ||
                  vendor?.vendor_name
                }
                className="w-[50px] h-[50px] rounded-lg"
              />
            ) : (
              <img
                src="/assets/default.jpg"
                alt="Default"
                className="w-[50px] h-[50px] rounded-lg"
              />
            )}
          </td>

          {/* MAIN INFO CELL */}
          <td className={style}>
            <h1 className="font-bold text-xl">
              {product?.product_name ||
                admin?.first_name ||
                staff?.first_name ||
                vendor?.vendor_name}
            </h1>

            {batch && (
              <div className="text-sm">
                <p>Manufactured: {batch.manufacture_date ? String(batch.manufacture_date) : "N/A"}</p>
                <p>Expires: {batch.expiry_date ? String(batch.expiry_date) : "N/A"}</p>
                <p>Received: {batch.recieved_date ? String(batch.recieved_date) : "N/A"}</p>
                <p>Remaining: {batch.quantity_remaining ?? 0}</p>
              </div>
            )}
          </td>
        </>
      )}
    </tr>
  );
}
