import { User } from '../user.entity';

export class CreateUserDto {
  employeeId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  departmentName: string;

  static toUserEntity(dto: CreateUserDto): User {
    const user = new User();
    user.employeeId = dto.employeeId;
    user.firstName = dto.firstName;
    user.middleName = dto.middleName;
    user.lastName = dto.lastName;
    user.departmentName = dto.departmentName;

    return user;
  }
}
