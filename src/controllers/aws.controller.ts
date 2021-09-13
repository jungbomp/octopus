import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { AWSService } from 'src/services/aws.service';

@Controller('aws')
export class AWSController {
  constructor(private readonly awsService: AWSService) {}
}
