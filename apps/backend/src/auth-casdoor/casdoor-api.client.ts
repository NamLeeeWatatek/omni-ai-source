import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class CasdoorApiClient {
  private readonly logger = new Logger(CasdoorApiClient.name);
  private readonly casdoorEndpoint: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly orgName: string;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.casdoorEndpoint =
      process.env.CASDOOR_ENDPOINT || 'http://localhost:8030';
    this.clientId = process.env.CASDOOR_CLIENT_ID || '';
    this.clientSecret = process.env.CASDOOR_CLIENT_SECRET || '';
    this.orgName = process.env.CASDOOR_ORG_NAME || 'built-in';
  }

  private async getAdminToken(): Promise<string> {
    const tokenUrl = `${this.casdoorEndpoint}/api/login/oauth/access_token`;

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: 'read write',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to get admin token');
    }

    const data = await response.json();
    return data.access_token;
  }

  async getUsers(): Promise<any[]> {
    try {
      const token = await this.getAdminToken();
      const url = `${this.casdoorEndpoint}/api/get-users?owner=${this.orgName}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get users: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      this.logger.error(`Failed to get users from Casdoor: ${error.message}`);
      throw error;
    }
  }

  async getUser(name: string): Promise<any> {
    try {
      const token = await this.getAdminToken();
      const url = `${this.casdoorEndpoint}/api/get-user?owner=${this.orgName}&name=${name}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get user: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      this.logger.error(`Failed to get user from Casdoor: ${error.message}`);
      throw error;
    }
  }

  async createUser(userData: {
    name: string;
    displayName: string;
    email: string;
    password?: string;
    tag?: string;
    type?: string;
  }): Promise<any> {
    try {
      const token = await this.getAdminToken();
      const url = `${this.casdoorEndpoint}/api/add-user`;

      const user = {
        owner: this.orgName,
        name: userData.name,
        displayName: userData.displayName,
        email: userData.email,
        password: userData.password || '',
        tag: userData.tag || 'user',
        type: userData.type || 'normal-user',
        isAdmin: userData.tag === 'admin' || userData.tag === 'super_admin',
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create user: ${error}`);
      }

      const result = await response.json();
      if (result.status !== 'ok') {
        throw new Error(result.msg || 'Failed to create user');
      }

      this.logger.log(`Created user in Casdoor: ${userData.email}`);
      return result.data;
    } catch (error) {
      this.logger.error(`Failed to create user in Casdoor: ${error.message}`);
      throw error;
    }
  }

  async updateUser(
    name: string,
    updates: {
      displayName?: string;
      email?: string;
      tag?: string;
      type?: string;
      isAdmin?: boolean;
    },
  ): Promise<any> {
    try {
      const token = await this.getAdminToken();

      const currentUser = await this.getUser(name);
      if (!currentUser) {
        throw new Error(`User not found: ${name}`);
      }

      const updatedUser = {
        ...currentUser,
        ...updates,
      };

      const url = `${this.casdoorEndpoint}/api/update-user`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update user: ${error}`);
      }

      const result = await response.json();
      if (result.status !== 'ok') {
        throw new Error(result.msg || 'Failed to update user');
      }

      this.logger.log(`Updated user in Casdoor: ${name}`);
      return result.data;
    } catch (error) {
      this.logger.error(`Failed to update user in Casdoor: ${error.message}`);
      throw error;
    }
  }

  async deleteUser(name: string): Promise<void> {
    try {
      const token = await this.getAdminToken();
      const url = `${this.casdoorEndpoint}/api/delete-user`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: this.orgName,
          name: name,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete user: ${error}`);
      }

      const result = await response.json();
      if (result.status !== 'ok') {
        throw new Error(result.msg || 'Failed to delete user');
      }

      this.logger.log(`Deleted user from Casdoor: ${name}`);
    } catch (error) {
      this.logger.error(`Failed to delete user from Casdoor: ${error.message}`);
      throw error;
    }
  }

  async getRoles(): Promise<any[]> {
    try {
      const token = await this.getAdminToken();
      const url = `${this.casdoorEndpoint}/api/get-roles?owner=${this.orgName}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get roles: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      this.logger.error(`Failed to get roles from Casdoor: ${error.message}`);
      throw error;
    }
  }

  async getPermissions(): Promise<any[]> {
    try {
      const token = await this.getAdminToken();
      const url = `${this.casdoorEndpoint}/api/get-permissions?owner=${this.orgName}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get permissions: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      this.logger.error(
        `Failed to get permissions from Casdoor: ${error.message}`,
      );
      throw error;
    }
  }
}
