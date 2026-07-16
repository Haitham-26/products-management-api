type KeyTree<T> = {
  [K in keyof T]: T[K] extends string ? string : KeyTree<T[K]>;
};

const createKeys = (prefix = "") => {
  return new Proxy(
    {},
    {
      get(_, prop: string) {
        const path = prefix ? `${prefix}.${prop}` : prop;

        return createKeys(path);
      },
    },
  );
};

type APIErrorKeyShape = {
  internal: string;
  unauthorized: string;

  login: {
    email: {
      invalid: string;
    };
    password: {
      invalid: string;
      short: string;
      long: string;
      regex: string;
      incorrect: string;
    };
    differentMethod: string;
    notFound: string;
    notVerified: string;
  };

  "google-login": {
    differentMethod: string;
    notVerified: string;
  };

  signup: {
    email: {
      name: {
        invalid: string;
        short: string;
        long: string;
        regex: string;
      };
      company: {
        invalid: string;
        long: string;
      };
      email: {
        invalid: string;
      };
      password: {
        invalid: string;
        short: string;
        long: string;
        regex: string;
      };
      userExists: string;
      notVerifiedExists: string;
    };

    token: {
      token: {
        invalid: string;
        length: string;
        incorrect: string;
        expired: string;
      };
      email: {
        invalid: string;
      };
      notFound: string;
    };
  };

  refreshToken: {
    token: {
      invalid: string;
    };
  };

  forgotPassword: {
    email: {
      email: {
        invalid: string;
      };
      notFound: string;
      notVerified: string;
      differentMethod: string;
    };

    token: {
      token: {
        invalid: string;
        length: string;
        incorrect: string;
        expired: string;
        missing: string;
      };
    };

    new: {
      newPassword: {
        invalid: string;
        short: string;
        long: string;
        regex: string;
      };
      samePassword: string;
    };
  };
};

export const APIErrorKeys = createKeys(
  "serverErrors",
) as KeyTree<APIErrorKeyShape>;
