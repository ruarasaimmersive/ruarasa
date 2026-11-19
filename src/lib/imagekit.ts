const IMAGEKIT_AUTH = import.meta.env.IMAGEKIT_AUTH || process.env.IMAGEKIT_AUTH || ''

export const uploadImageToImageKit = async (
  base64Image: string,
  fileName: string = 'payment_proof.jpg',
): Promise<string> => {
  // Convert Base64 to Blob
  const base64Data = base64Image.replace(
    /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
    '',
  )
  const byteString = atob(base64Data)
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  const blob = new Blob([ab], { type: 'image/jpeg' })
  const file = new File([blob], fileName, { type: 'image/jpeg' })

  // Create FormData
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileName', fileName)
  formData.append('folder', '/ruarasa/payment_proofs')

  console.log('📤 Uploading image to ImageKit...')

  const response = await fetch(
    'https://upload.imagekit.io/api/v1/files/upload',
    {
      method: 'POST',
      headers: {
        Authorization: IMAGEKIT_AUTH,
      },
      body: formData,
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ImageKit Upload Failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('✅ Image uploaded:', data.url)
  return data.url
}
