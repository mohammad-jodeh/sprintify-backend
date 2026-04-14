import {
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
} from "class-validator";
import { ProjectPermission } from "../../types";

@ValidatorConstraint({ name: "IsNotAdministrator", async: false })
export class IsNotAdministratorConstraint
  implements ValidatorConstraintInterface
{
  validate(permission: ProjectPermission, args: ValidationArguments) {
    return permission !== ProjectPermission.ADMINISTRATOR;
  }
  defaultMessage(args: ValidationArguments) {
    return "Permission cannot be set to ADMINISTRATOR.";
  }
}

export function IsNotAdministrator(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    Validate(IsNotAdministratorConstraint, validationOptions)(
      object,
      propertyName
    );
  };
}
