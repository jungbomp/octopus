import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Method } from 'axios';
import { StoreType } from 'src/types';
import { guid } from '../utils/guid.util';

@Injectable()
export class DropboxApiService {
  private readonly logger = new Logger(DropboxApiService.name);

  private dropboxApiConfig: DropboxApiConfig;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.dropboxApiConfig = this.configService.get<DropboxApiConfig>('walmartApiConfig');
  }
}

interface DropboxApiConfig {
  baseUrl: string,
  awt: string
}

interface WalmartApiAccessTokenType {
  access_token: string,
  token_type: string,
  expires: Date
}