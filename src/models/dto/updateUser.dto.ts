import { User } from '../user.entity';

export class UpdateUserDto {
  firstName: string;
  middleName: string;
  lastName: string;
  departmentName: string;

  static toUserEntity(dto: UpdateUserDto): User {
    const user = new User();
    user.firstName = dto.firstName;
    user.middleName = dto.middleName;
    user.lastName = dto.lastName;
    user.departmentName = dto.departmentName;

    return user;
  }
}