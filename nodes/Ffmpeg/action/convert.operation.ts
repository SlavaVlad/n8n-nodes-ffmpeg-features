import type {
	IExecuteFunctions,
	INodeExecutionData,
} from 'n8n-workflow';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as childProcess from 'child_process';

export async function execute(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {

	const returnData: INodeExecutionData[] = [];

	const outputFileNameRaw = this.getNodeParameter('outputFileName', 0) as string;
	const outputBinary = this.getNodeParameter('outputBinary', 0) as string;
	const bitrate = this.getNodeParameter('bitrate', 0, '') as string;
	const ffmpegConvertArgs = this.getNodeParameter('ffmpegConvertArgs', 0) as string;
	const outputFormat = this.getNodeParameter('outputFormat', 0, 'mp4') as string; // Read selected output format

	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (!item.binary) {
			continue;
		}

		const [binaryKey] = Object.keys(item.binary);
		if (!binaryKey) {
			continue;
		}

		const binaryData = item.binary[binaryKey];
		if (!binaryData?.data) {
			continue;
		}

		const inputExtension = path.extname(binaryData.fileName || '') || '.tmp';

		const outputFileNameBase = path.basename(outputFileNameRaw, path.extname(outputFileNameRaw));
		const outputFileName = `${outputFileNameBase}.${outputFormat}`;
		const outputExtension = `.${outputFormat}`;

		const tempInputFilePath = path.join(
			os.tmpdir(),
			`ffconvert_in_${Date.now()}_${Math.random().toString(36).slice(2)}${inputExtension}`
		);
		fs.writeFileSync(tempInputFilePath, Buffer.from(binaryData.data, 'base64'));

		const tempOutputFilePath = path.join(
			os.tmpdir(),
			`ffconvert_out_${Date.now()}_${Math.random().toString(36).slice(2)}${outputExtension}`
		);

		const bitrateOption = bitrate ? ` -b:a ${bitrate}` : '';

		let cmd = ffmpegConvertArgs;
		cmd = cmd.replace(/{input}/g, `"${tempInputFilePath}"`);
		cmd = cmd.replace(/{output}/g, `"${tempOutputFilePath}"`);
		cmd = cmd.replace(/{bitrate_option}/g, bitrateOption);


		try {
			childProcess.execSync(`ffmpeg ${cmd}`, { stdio: 'inherit' }); // Changed to inherit to see ffmpeg logs if needed
		} catch (error) {
			if (fs.existsSync(tempInputFilePath)) {
				fs.unlinkSync(tempInputFilePath);
			}
			if (fs.existsSync(tempOutputFilePath)) {
				fs.unlinkSync(tempOutputFilePath);
			}
			throw new Error(`FFmpeg convert command failed: ${error}. Command: ffmpeg ${cmd}`);
		}

		const outputData = fs.readFileSync(tempOutputFilePath);
		const fileSize = fs.statSync(tempOutputFilePath).size;

		let mimeType = 'application/octet-stream'; // Default mime type
		if (outputFormat === 'mp3') {
			mimeType = 'audio/mpeg';
		} else if (outputFormat === 'mp4') {
			mimeType = 'video/mp4';
		} else if (outputFormat === 'wav') {
			mimeType = 'audio/wav';
		} else if (outputFormat === 'ogg') {
			mimeType = 'audio/ogg';
		} else if (outputFormat === 'webm') {
			mimeType = 'video/webm';
		} else if (outputFormat === 'aac') {
			mimeType = 'audio/aac';
		} else if (outputFormat === 'flac') {
			mimeType = 'audio/flac';
		} else if (outputFormat === 'mkv') {
			mimeType = 'video/x-matroska';
		} else if (outputFormat === 'mov') {
			mimeType = 'video/quicktime';
		} else if (outputFormat === 'gif') {
			mimeType = 'image/gif';
		}

		returnData.push({
			json: {
				success: true,
				fileSize,
				inputFileName: binaryData.fileName,
				outputFileName: outputFileName,
				command: `ffmpeg ${cmd}`
			},
			binary: {
				[outputBinary]: await this.helpers.prepareBinaryData(outputData, outputFileName, mimeType),
			},
			pairedItem: {
				item: i,
			},
		});

		if (fs.existsSync(tempInputFilePath)) {
			fs.unlinkSync(tempInputFilePath);
		}
		if (fs.existsSync(tempOutputFilePath)) {
			fs.unlinkSync(tempOutputFilePath);
		}
	}

	return returnData;
}

