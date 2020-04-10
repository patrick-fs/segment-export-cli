import axios from 'axios'
import config from './config'

export interface ExportOptions {
  segment_id: string;
  type: string;
  format: string;
  time_range: {
    start: string;
    end: string;
  };
}

export interface OperationResponse {
  state: string;
  estimatePctComplete: number;
  results: {
    searchExportId: string;
    expires: string;
  };
}

export interface FileUrlResponse {
  location: string;
  expires: string;
}

export enum ExportTypes {
  event = 'TYPE_EVENT',
  individual = 'TYPE_INDIVIDUAL'
}

export enum ExportFormats {
  json = 'FORMAT_NDJSON',
  csv = 'FORMAT_CSV'
}

// TODO: export this init function so that clients can actually set these parameters
const initApi = ({apiKey, baseURL}: { apiKey: string; baseURL: string}) => {
  return axios.create({
    baseURL: baseURL,
    timeout: 1000,
    headers: {
      Authorization: `Basic ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })
}

const api = initApi({apiKey: config().API_KEY, baseURL: config().API_DOMAIN})

export const startExport = async (options: ExportOptions) => {
  const exportResp = await api.post<{operationId: string}>('/segments/v1/exports', options)
  return exportResp.data
}

export const getOperation = async (operationId: string) => {
  const operationsResp = await api.get<OperationResponse>(`/operations/v1/${operationId}`)
  return operationsResp.data
}

export const getExportFileURL = async (exportId: string) => {
  const downloadResp =  await api.get<FileUrlResponse>(`/search/v1/exports/${exportId}/results`)
  return downloadResp.data
}

export const getExportFileStream = async (fileUrl: FileUrlResponse) => {
  return axios.get(fileUrl.location, {responseType: 'stream'})
}
