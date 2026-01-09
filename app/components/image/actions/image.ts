export async function convertBlobUrlToFile(blobUrl: string){
    //1. Fetch the blob from the URL
    const response = await fetch(blobUrl);

    //2. Convert the response into a blob
    const blob = await response.blob();

    //3.Generate a random file name
    const fileName = Math.random().toString(36).slice(2,9);

    //4. Determine the MIME type
    const mineType = blob.type || "application/octet-stream";

    // 5. Create a file object
    const file = new File([blob], `$(fileName).${mineType.split("/")[1]}`,
{
    type: mineType,
});
// 6. return File
return file;
}

