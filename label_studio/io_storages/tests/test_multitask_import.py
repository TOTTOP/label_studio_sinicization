import json
import sys

import boto3
import pytest
from django.test import TestCase
from io_storages.tests.factories import (
    AzureBlobImportStorageFactory,
    GCSImportStorageFactory,
    RedisImportStorageFactory,
    S3ImportStorageFactory,
)
from moto import mock_s3
from projects.tests.factories import ProjectFactory
from rest_framework.test import APIClient
from tests.utils import azure_client_mock, gcs_client_mock, redis_client_mock

# Skip on Windows before any forking is attempted
if sys.platform == 'win32':
    pytest.skip('forked tests not supported on Windows', allow_module_level=True)


@pytest.mark.forked
class TestMultiTaskImport(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Setup project with simple config
        cls.project = ProjectFactory()

        # Common test data
        cls.common_task_data = [
            {'data': {'image_url': 'http://ggg.com/image.jpg', 'text': 'Task 1 text'}},
            {'data': {'image_url': 'http://ggg.com/image2.jpg', 'text': 'Task 2 text'}},
        ]

    def _test_storage_import(self, storage_class, task_data, **storage_kwargs):
        """Helper to test import for a specific storage type"""

        # can't do this in the classmethod for some reason, or self.client != cls.client
        client = APIClient()
        client.force_authenticate(user=self.project.created_by)

        # Setup storage with required credentials

        storage = storage_class(project=self.project, **storage_kwargs)

        # Validate connection before sync
        try:
            storage.validate_connection()
        except Exception as e:
            self.fail(f'Storage connection validation failed: {str(e)}')

        # Sync storage
        # Don't have to wait for sync to complete because it's blocking without rq
        storage.sync()

        # Validate tasks were imported correctly
        tasks_response = client.get(f'/api/tasks?project={self.project.id}')
        self.assertEqual(tasks_response.status_code, 200)
        tasks = tasks_response.json()['tasks']
        self.assertEqual(len(tasks), len(task_data))

        # Validate task content
        for task, expected_data in zip(tasks, task_data):
            self.assertEqual(task['data'], expected_data['data'])

    def test_import_multiple_tasks_s3(self):
        with mock_s3():
            # Setup S3 bucket and test data
            s3 = boto3.client('s3', region_name='us-east-1')
            bucket_name = 'pytest-s3-jsons'
            s3.create_bucket(Bucket=bucket_name)

            # Put test data into S3
            s3.put_object(Bucket=bucket_name, Key='test.json', Body=json.dumps(self.common_task_data))

            self._test_storage_import(
                S3ImportStorageFactory,
                self.common_task_data,
                bucket='pytest-s3-jsons',
                aws_access_key_id='example',
                aws_secret_access_key='example',
                use_blob_urls=False,
            )

    def test_import_multiple_tasks_gcs(self):
        # initialize mock with sample data
        with gcs_client_mock(sample_json_contents=self.common_task_data, sample_blob_names=['test.json']):

            self._test_storage_import(
                GCSImportStorageFactory,
                self.common_task_data,
                # bucket name just has to end in "_JSON" for the mock to work
                # and to not collide with other tests
                bucket='unique-bucket-name_JSON',
                use_blob_urls=False,
            )

    def test_import_multiple_tasks_azure(self):
        # initialize mock with sample data
        with azure_client_mock(sample_json_contents=self.common_task_data, sample_blob_names=['test.json']):

            self._test_storage_import(
                AzureBlobImportStorageFactory,
                self.common_task_data,
                use_blob_urls=False,
            )

    def test_import_multiple_tasks_redis(self):
        with redis_client_mock() as redis:

            redis.set('test.json', json.dumps(self.common_task_data))

            self._test_storage_import(
                RedisImportStorageFactory,
                self.common_task_data,
                path='',
                use_blob_urls=False,
            )
