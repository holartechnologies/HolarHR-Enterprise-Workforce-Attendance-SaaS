import "next-auth";
import { JWT } from "@auth/core/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      companyId: string;
      employeeId?: string;
      companyName: string;
      companySlug: string;
      plan: string;
    };
  }

  interface User {
    role: string;
    companyId: string;
    employeeId?: string;
    companyName: string;
    companySlug: string;
    plan: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: string;
    companyId: string;
    employeeId?: string;
    companyName: string;
    companySlug: string;
    plan: string;
  }
}
