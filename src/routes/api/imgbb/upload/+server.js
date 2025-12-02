import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	try {
		const { image, apiKey } = await request.json();

		if (!image) {
			return json({ success: false, error: 'No image provided' }, { status: 400 });
		}

		if (!apiKey) {
			return json(
				{ success: false, error: 'ImgBB API key not provided. Please configure it in Settings > Accounts > ImgBB.' },
				{ status: 400 }
			);
		}

		// Remove data URL prefix if present
		const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

		// Upload to ImgBB - API expects form data with key and image
		const formData = new FormData();
		formData.append('key', apiKey);
		formData.append('image', base64Image);

		const response = await fetch('https://api.imgbb.com/1/upload', {
			method: 'POST',
			body: formData
		});

		const data = await response.json();

		if (!response.ok || !data.success) {
			throw new Error(data.error?.message || 'Failed to upload image');
		}

		return json({
			success: true,
			url: data.data.url,
			deleteUrl: data.data.delete_url,
			id: data.data.id
		});
	} catch (error) {
		console.error('Error uploading to ImgBB:', error);
		return json(
			{
				success: false,
				error: error.message || 'Failed to upload image'
			},
			{ status: 500 }
		);
	}
}

