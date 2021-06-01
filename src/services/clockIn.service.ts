import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClockInDto } from '../models/dto/createClockIn.dto';
import { ClockIn } from '../models/clockIn.entity';
import { GoogleApiService } from './googleApi.service';
import { DateTimeUtil } from '../utils/dateTime.util';

@Injectable()
export class ClockInService {
  private readonly logger = new Logger(ClockInService.name);

  private clockInConfig: ClockInConfig = null;
  private googleSheetFileId: string = null;

  // private clockInConfig: ClockInConfig = {
  //   'employeeClockManagementFolderId': '1CXNLJuFAaG4ZLZ3QCnjkBdcyyXor3-iO',
  //   'currentYearFolderId': '1s4h5t9Yald-5aIm26TkMUZFh3wP6aVDP',
  //   'templateFileId': '12RrExnyLX0jAo9possmh104iPALZSKrcRLqq7p5-pW8',
  // };
  // private googleSheetFileId: string = '1N-g3hRCsoSfpyfXfe6b4eaYg1fk1251mvOYyaOKPV0o';

  constructor(
    @InjectRepository(ClockIn)
    private readonly clockInRepository: Repository<ClockIn>,
    private readonly configService: ConfigService,
    private readonly googleApiService: GoogleApiService,
    private readonly dateTimeUtil: DateTimeUtil,
  ) {
    this.clockInConfig = this.configService.get<ClockInConfig>('clockIn');
    // this.setCurrentGoogleSheetFileId();
  }

  async findAll(): Promise<ClockIn[]> {
    return this.clockInRepository.find();
  }

  find(employeeId: string): Promise<ClockIn[]> {
    return this.clockInRepository.find({ where: { employeeId }});
  }

  async create(createClockInDto: CreateClockInDto): Promise<ClockIn> {
    const clockIn = CreateClockInDto.toClockInEntity(createClockInDto);
    this.logger.log(`clock in with ${clockIn.employeeId} and ${clockIn.clockInDttm}`);

    try {
      const latestClockIn = await this.findLatestClockIn(clockIn.employeeId);
      this.logger.log('latest clock In: ');
      this.logger.log(latestClockIn);
      if (latestClockIn !== undefined && Number(clockIn.clockInDttm.substr(-6)) - Number(latestClockIn.clockInDttm.substr(-6)) > -1 && Number(clockIn.clockInDttm.substr(-6)) - Number(latestClockIn.clockInDttm.substr(-6)) < 3) {
        return latestClockIn;
      }

      await this.clockInRepository.insert(clockIn);
      this.clockInToGoogleSheet(clockIn);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        this.logger.error(`Failed to insert clockin with ${clockIn.employeeId} and ${clockIn.clockInDttm}`);
        return this.clockInRepository.findOne(clockIn);
      }
      
      throw error;
    }

    return clockIn;
  }

  private async findLatestClockIn(employeeId: string): Promise<ClockIn> {
    return (await this.clockInRepository.find(({
      where: { employeeId },
      order: { clockInDttm: 'DESC' },
      take: 1
    }))).shift();
  }

  async createNewClockInGoogleSheetIfNewDate(): Promise<string> {
    const fileId = this.googleSheetFileId;
    const filemeta = await this.googleApiService.getFileMetadata(fileId);
    const curDate = this.dateTimeUtil.getCurrentDate();
    const curYear = curDate.getFullYear();
    const periods = filemeta.title.match(/([0-9]{2}|[0-9]{1})\/([0-9]{2}|[0-9]{1})/g).map((period: string): Date => new Date(`${curYear}/${period}`)).sort();

    if (periods[1] < curDate) {
      const periodFrom = new Date(periods[1].getTime() + (60 * 60 * 24 * 1000));
      const periodTo = new Date(periodFrom.getTime() + (60 * 60 * 24 * 13 * 1000));
      const newSeq = Number(filemeta.title.split(' ').shift()) + 1;

      const newFileId = await this.createNewClockInGoogleSheet(periodFrom, periodTo, newSeq);
      await this.initNewClockInGoogleSheet(newFileId, periodFrom);
      this.logger.log(`Created a new clock-in google sheet (${newFileId})`);
      this.googleSheetFileId = newFileId;
      return newFileId;
    }

    return fileId;
  }

  private async setCurrentGoogleSheetFileId(): Promise<string> {
    this.googleSheetFileId = await this.getLatestClockInGoogleSheetId();
    return this.googleSheetFileId;
  }

  private async getLatestClockInGoogleSheetId(): Promise<string> {
    const children = await this.googleApiService.getFolderChildren(this.clockInConfig.currentYearFolderId, null);
    const childrenMetadata = [];

    for (let i = 0; i < children.length; i++) {
      childrenMetadata.push(await this.googleApiService.getFileMetadata(children[i].id))
    }
    // const childrenMetadata = await Promise.all(children.map(async child => await this.googleApiService.getFileMetadata(child.id)));
    childrenMetadata.sort((lhs, rhs) => Number(lhs.title.substring(0, 2)) - Number(rhs.title.substring(0, 2)));
    
    return childrenMetadata.pop().id;
  }

  private async clockInToGoogleSheet(clockIn: ClockIn): Promise<void> {
    const fileId = this.googleSheetFileId ?? await this.setCurrentGoogleSheetFileId();

    // const filemeta = await this.googleApiService.getFileMetadata(fileId);
    // const clockInDate = new Date(`${clockIn.clockInDttm.substring(0, 4)}/${clockIn.clockInDttm.substring(4, 6)}/${clockIn.clockInDttm.substring(6, 8)}`);
    // const curYear = clockInDate.getFullYear();
    // const periods = filemeta.title.match(/([0-9]{2}|[0-9]{1})\/([0-9]{2}|[0-9]{1})/g).map((period: string): Date => new Date(`${curYear}/${period}`)).sort();
    
    const clockInEmployeeIds = await this.googleApiService.spreadSheetValuesGet(fileId, "Daily Scan Data WH!F4:F");
    
    const data = [{
      range: `${'Daily Scan Data WH'}!F${clockInEmployeeIds.values.length+4}:G${clockInEmployeeIds.values.length+4}`,
      values: [ [clockIn.employeeId, this.dateTimeUtil.convertDatetimeFormat(clockIn.clockInDttm)] ]
    }];

    await this.googleApiService.spreadSheetValuesUpdate(fileId, data);
  }

  private async createNewClockInGoogleSheet(dateFrom: Date, dateTo: Date, seq: number): Promise<string> {
    const fromMM = ("0" + (dateFrom.getMonth() + 1)).slice(-2);
    const fromDD = ("0" + dateFrom.getDate()).slice(-2);
    const tillMM = ("0" + (dateTo.getMonth() + 1)).slice(-2);
    const tillDD = ("0" + dateTo.getDate()).slice(-2);
    const seqStr = ("0" + seq).slice(-2);

    const { templateFileId, currentYearFolderId, employeeClockManagementFolderId } = this.clockInConfig;
    
    const newFileName = `${seqStr} [${fromMM}/${fromDD} - ${tillMM}/${tillDD}] Employee Clock In Table`;
    const newFileId = await this.googleApiService.copyFile(templateFileId);
    const response = await this.googleApiService.patchFile(newFileId, newFileName, currentYearFolderId, employeeClockManagementFolderId);
    return response.id;
  }

  private async initNewClockInGoogleSheet(fileId: string, startDate: Date): Promise<any> {
    const fromMM = ("0" + (startDate.getMonth() + 1)).slice(-2);
    const fromDD = ("0" + startDate.getDate()).slice(-2);

    const data = [{
      range: `${'Overview'}!B2:B2`,
      values: [ [`${fromMM}/${fromDD}`] ]
    }];

    const response = await this.googleApiService.spreadSheetValuesUpdate(fileId, data);
    return response;
  }
}

interface ClockInConfig {
  employeeClockManagementFolderId: string,
  currentYearFolderId: string,
  templateFileId: string,
}
