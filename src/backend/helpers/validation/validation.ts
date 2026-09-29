import { celebrate, Joi } from "celebrate";

export const filterQuerySchema = Joi.object({
  limit: Joi.number().default(10),
  skip: Joi.number().default(0),
  filter: Joi.string().optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional(),
});

export const emailSchema = Joi.string().email().required();
export const mobileSchema = Joi.string().max(15).min(10).required();
export const uuidSchema = Joi.object({ id: Joi.string().uuid().required() });
export const uuidSchemaArray = Joi.array().items(Joi.string().uuid());

export const paramsWithUUID = celebrate({
  params: uuidSchema,
});

export const bodywithRefreshToken = celebrate({
  body: Joi.object({ refreshToken: Joi.string().required() }),
});

export const LoginOBJ = {
  email: Joi.string().required(),
  password: Joi.string().required(),
};

export const loginSchema = celebrate({
  body: Joi.object(LoginOBJ),
});

export const resetPasswordSchema = celebrate({
  body: Joi.object({
    id: Joi.string().uuid().required(),
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.string().min(6).required(),
  }),
});

export const forgotPasswordSchema = celebrate({
  body: Joi.object({
    email: emailSchema,
  }),
});
