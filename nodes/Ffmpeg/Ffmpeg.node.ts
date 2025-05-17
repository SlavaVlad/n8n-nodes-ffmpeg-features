import { IExecuteFunctions } from 'n8n-workflow';
import { INodeExecutionData, INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';
import * as merge from './action/merge.operation';
import * as overlay from './action/overlay.operation';
import * as info from './action/info.operation';
import * as custom from './action/custom.operation';
import * as convert from './action/convert.operation';

export class Ffmpeg implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Ffmpeg',
        name: 'ffmpeg',
        icon: { light: 'file:ffmpeg.light.svg', dark: 'file:ffmpeg.dark.svg' },
        group: ['input'],
        version: 1,
        subtitle: 'Manipulate media files using FFMPEG',
        description: 'Merge, overlay, get info, convert, or run custom FFmpeg commands on media files. FFmpeg supports a wide range of input formats.', // Updated description with input format note


        defaults: {
            name: 'FFMPEG',
        },
        inputs: ['main'] as NodeConnectionType[],
        outputs: ['main'] as NodeConnectionType[],
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                options: [
                    { name: 'Merge Videos', value: 'merge' },
                    { name: 'Overlay Audio', value: 'overlay' },
                    { name: 'Info', value: 'info' },
                    { name: 'Custom Command', value: 'custom' },
                    { name: 'Convert', value: 'convert' },
                ],
                default: 'merge',
                noDataExpression: true,
                description: 'Choose operation: Merge, Overlay, Info, Convert, or Custom FFmpeg command. For Convert, FFmpeg supports many input formats.', // Updated description


            },
            {
                displayName: 'Minimum Files to Merge',
                name: 'minFiles',
                type: 'number',
                default: 2,
                required: true,
                description: 'Minimum number of files required before merging',
                displayOptions: {
                    show: {
                        operation: ['merge'],
                    },
                },
            },
            {
                displayName: 'Output File Name',
                name: 'outputFileName',
                type: 'string',
                default: 'output.mp4',
                required: true,
                description: 'Name of the output file. The extension will be automatically set based on the selected Output Format for the Convert operation.',
                displayOptions: {
                    show: {
                        operation: ['merge', 'overlay', 'custom', 'convert'],
                    },
                },

            },
            {
                displayName: 'Output Binary Property',
                name: 'outputBinary',
                type: 'string',
                default: 'outputData',
                required: true,
                description: 'Name of the output binary property',
                displayOptions: {
                    show: {
                        operation: ['merge', 'overlay', 'custom', 'convert'],
                    },
                },

            },
            {
                displayName: 'FFmpeg Merge Arguments',
                name: 'ffmpegMergeArgs',
                type: 'string',
                default: '-f concat -safe 0 -i "{input}" -c:v libx264 -c:a aac "{output}"',
                description: 'Custom FFmpeg command. Use {input} for concat file and {output} for output file.',
                displayOptions: {
                    show: {
                        operation: ['merge'],
                    },
                },

            },
            {
				displayName: 'FFmpeg Overlay Arguments',
				name: 'ffmpegOverlayArgs',
				type: 'string',
				default: '-i "{video}" -i "{audio}" -c:v copy -c:a aac "{output}"',
				description: 'Шаблон FFmpeg: {video}, {audio}, {output}',
                displayOptions: {
                    show: {
                        operation: ['overlay'],
                    },
                },
			},
            {
                displayName: 'Custom FFmpeg Command',
                name: 'ffmpegCustomArgs',
                type: 'string',
                default: '-i "{input}" -vf "transpose=1" "{output}"',
                description: 'Enter your FFmpeg command. Use {input} for the input file and {output} for the output file.',
                displayOptions: {
                    show: {
                        operation: ['custom'],
                    },
                },
            },

            {
                displayName: 'Bitrate (e.g., 192k)',
                name: 'bitrate',
                type: 'string',
                default: '',
                placeholder: '192k',
                description: 'Optional. Audio bitrate for conversion (e.g., 128k, 192k, 256k). Leave empty to use FFmpeg default.',
                displayOptions: {
                    show: {
                        operation: ['convert'],
                    },
                },
            },
            {
                displayName: 'FFmpeg Convert Arguments',
                name: 'ffmpegConvertArgs',
                type: 'string',
                default: '-i "{input}"{bitrate_option} "{output}"',
                description: 'FFmpeg command template for conversion. Placeholders: {input}, {output}, {bitrate_option}. The extension of {output} will be set by the Output Format selection. Example: -i "{input}" -c:v copy -c:a aac{bitrate_option} "{output}" ',
                displayOptions: {
                    show: {
                        operation: ['convert'],
                    },
                },
            },

            {
                displayName: 'Output Format',
                name: 'outputFormat',
                type: 'options',
                options: [
                    { name: 'MP3 (audio)', value: 'mp3' },
                    { name: 'AAC (audio)', value: 'aac' },
                    { name: 'FLAC (audio)', value: 'flac' },
                    { name: 'WAV (audio)', value: 'wav' },
                    { name: 'OGG (Vorbis audio)', value: 'ogg' },
                    { name: 'MP4 (video)', value: 'mp4' },
                    { name: 'WebM (VP9/Opus video)', value: 'webm' },
                    { name: 'MKV (video)', value: 'mkv' },
                    { name: 'MOV (video)', value: 'mov' },
                    { name: 'GIF (animated)', value: 'gif' },
                ],
                default: 'mp4',
                description: 'Select the desired output format. This will determine the file extension and MIME type.',
                displayOptions: {
                    show: {
                        operation: ['convert'],
                    },
                },
            },
        ],
    };

    async execute(this: IExecuteFunctions) {
		const operation = this.getNodeParameter('operation', 0, 'merge');
		const items = this.getInputData();
		let returnData: INodeExecutionData[] = [];


		if (operation === 'merge') {
			returnData = await merge.execute.call(this, items);
		}
		if (operation === 'overlay') {
			returnData = await overlay.execute.call(this, items);
		}
		if (operation === 'info') {
			returnData = await info.execute.call(this, items);
		}

        if (operation === 'custom') {
            returnData = await custom.execute.call(this, items);
        }
        if (operation === 'convert') {
            returnData = await convert.execute.call(this, items);
        }

		return [returnData];
	}
}
