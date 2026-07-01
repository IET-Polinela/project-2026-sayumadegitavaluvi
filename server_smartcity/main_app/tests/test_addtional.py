from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory

from main_app.models import Report
from main_app.serializers import ReportSerializer
from main_app.views import get_next_status_action, serialize_report_row


User = get_user_model()


class AdditionalReportModelSerializerTests(TestCase):
    def setUp(self):
        self.warga_a = User.objects.create_user(
            username='warga_add_a',
            email='warga_add_a@gmail.com',
            password='TestPass123!',
            is_admin=False,
        )

        self.warga_b = User.objects.create_user(
            username='warga_add_b',
            email='warga_add_b@gmail.com',
            password='TestPass123!',
            is_admin=False,
        )

        self.report = Report.objects.create(
            title='Laporan Tambahan',
            category='Infrastruktur',
            description='Deskripsi laporan tambahan.',
            location='Lokasi Tambahan',
            status='REPORTED',
            reporter=self.warga_a,
        )

    def test_01_report_model_data_tersimpan(self):
        self.assertEqual(self.report.title, 'Laporan Tambahan')
        self.assertEqual(self.report.category, 'Infrastruktur')
        self.assertEqual(self.report.description, 'Deskripsi laporan tambahan.')
        self.assertEqual(self.report.location, 'Lokasi Tambahan')
        self.assertEqual(self.report.status, 'REPORTED')
        self.assertEqual(self.report.reporter, self.warga_a)

    def test_02_report_model_str_tidak_kosong(self):
        self.assertTrue(str(self.report))
        self.assertIn('Laporan', str(self.report))

    def test_03_serialize_report_row_memiliki_field_penting(self):
        data = serialize_report_row(self.report)

        self.assertEqual(data['id'], self.report.id)
        self.assertEqual(data['title'], self.report.title)
        self.assertEqual(data['location'], self.report.location)
        self.assertEqual(data['status'], self.report.status)
        self.assertIn('status_display', data)
        self.assertIn('next_action', data)

    def test_04_serializer_memiliki_field_utama(self):
        factory = APIRequestFactory()
        request = factory.get('/api/report/')
        request.user = self.warga_a

        serializer = ReportSerializer(
            self.report,
            context={'request': request}
        )

        data = serializer.data

        expected_fields = [
            'id',
            'title',
            'category',
            'description',
            'location',
            'status',
            'reporter',
            'reporter_name',
            'is_owner',
        ]

        for field in expected_fields:
            self.assertIn(field, data)

    def test_05_serializer_pemilik_melihat_reporter_name_asli(self):
        factory = APIRequestFactory()
        request = factory.get('/api/report/')
        request.user = self.warga_a

        serializer = ReportSerializer(
            self.report,
            context={'request': request}
        )

        data = serializer.data

        self.assertEqual(data['reporter'], 'Warga Anonim')
        self.assertEqual(data['reporter_name'], 'warga_add_a')
        self.assertTrue(data['is_owner'])

    def test_06_serializer_orang_lain_melihat_reporter_name_anonim(self):
        factory = APIRequestFactory()
        request = factory.get('/api/report/')
        request.user = self.warga_b

        serializer = ReportSerializer(
            self.report,
            context={'request': request}
        )

        data = serializer.data

        self.assertEqual(data['reporter'], 'Warga Anonim')
        self.assertEqual(data['reporter_name'], 'Warga Anonim')
        self.assertFalse(data['is_owner'])

    def test_07_serializer_tanpa_request_tetap_aman(self):
        serializer = ReportSerializer(self.report)
        data = serializer.data

        self.assertEqual(data['reporter'], 'Warga Anonim')
        self.assertEqual(data['reporter_name'], 'Warga Anonim')
        self.assertFalse(data['is_owner'])

    def test_08_next_status_reported_menuju_verified(self):
        next_action = get_next_status_action('REPORTED')

        self.assertIsNotNone(next_action)
        self.assertEqual(next_action['value'], 'VERIFIED')

    def test_09_next_status_verified_dan_in_progress_valid(self):
        verified_action = get_next_status_action('VERIFIED')
        progress_action = get_next_status_action('IN_PROGRESS')

        self.assertIsNotNone(verified_action)
        self.assertIsNotNone(progress_action)
        self.assertEqual(verified_action['value'], 'IN_PROGRESS')
        self.assertEqual(progress_action['value'], 'RESOLVED')

    def test_10_next_status_resolved_tidak_ada_lanjutan(self):
        next_action = get_next_status_action('RESOLVED')

        self.assertIsNone(next_action)


class AdditionalReportAPITests(APITestCase):
    def setUp(self):
        self.warga_a = User.objects.create_user(
            username='warga_api_a',
            email='warga_api_a@gmail.com',
            password='TestPass123!',
            is_admin=False,
        )

        self.warga_b = User.objects.create_user(
            username='warga_api_b',
            email='warga_api_b@gmail.com',
            password='TestPass123!',
            is_admin=False,
        )

        self.admin = User.objects.create_user(
            username='admin_api',
            email='admin_api@gmail.com',
            password='AdminPass123!',
            is_admin=True,
            is_staff=True,
        )

        self.draft_a = Report.objects.create(
            title='Draft Milik A',
            category='Infrastruktur',
            description='Draft milik warga A.',
            location='Lokasi A',
            status='DRAFT',
            reporter=self.warga_a,
        )

        self.reported_a = Report.objects.create(
            title='Reported Milik A',
            category='Infrastruktur',
            description='Laporan warga A yang sudah reported.',
            location='Lokasi Reported A',
            status='REPORTED',
            reporter=self.warga_a,
        )

        self.draft_b = Report.objects.create(
            title='Draft Milik B',
            category='Kebersihan',
            description='Draft milik warga B.',
            location='Lokasi B',
            status='DRAFT',
            reporter=self.warga_b,
        )

        self.reported_b = Report.objects.create(
            title='Laporan Publik B',
            category='Keamanan',
            description='Laporan warga B yang sudah reported.',
            location='Lokasi Publik B',
            status='REPORTED',
            reporter=self.warga_b,
        )

    def _get_results(self, response):
        if isinstance(response.data, dict) and 'results' in response.data:
            return response.data['results']

        return response.data

    def test_11_api_report_list_tanpa_login_ditolak(self):
        url = reverse('report-list')
        response = self.client.get(url)

        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )

    def test_12_api_my_reports_menampilkan_laporan_sendiri(self):
        self.client.force_authenticate(user=self.warga_a)

        url = reverse('report-list') + '?tab=my_reports'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = self._get_results(response)
        titles = [item['title'] for item in results]

        self.assertIn('Draft Milik A', titles)
        self.assertIn('Reported Milik A', titles)
        self.assertNotIn('Draft Milik B', titles)

    def test_13_api_feed_tidak_menampilkan_draft(self):
        self.client.force_authenticate(user=self.warga_a)

        url = reverse('report-list') + '?tab=feed'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = self._get_results(response)
        titles = [item['title'] for item in results]

        self.assertIn('Laporan Publik B', titles)
        self.assertNotIn('Draft Milik B', titles)

    def test_14_api_feed_reporter_tetap_anonim(self):
        self.client.force_authenticate(user=self.warga_a)

        url = reverse('report-list') + '?tab=feed'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = self._get_results(response)

        for item in results:
            self.assertEqual(item['reporter'], 'Warga Anonim')

    def test_15_api_detail_draft_milik_sendiri_bisa_dibaca(self):
        self.client.force_authenticate(user=self.warga_a)

        url = reverse('report-detail', kwargs={'pk': self.draft_a.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Draft Milik A')

    def test_16_api_detail_draft_orang_lain_tidak_bisa_dibaca(self):
        self.client.force_authenticate(user=self.warga_a)

        url = reverse('report-detail', kwargs={'pk': self.draft_b.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_17_api_create_report_valid(self):
        self.client.force_authenticate(user=self.warga_a)

        url = reverse('report-list')
        payload = {
            'title': 'Aduan Tambahan dari API',
            'category': 'Fasilitas Umum',
            'description': 'Deskripsi aduan tambahan dari API.',
            'location': 'Gedung A',
        }

        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Report.objects.filter(title='Aduan Tambahan dari API').exists()
        )

    def test_18_api_create_report_tanpa_title_ditolak(self):
        self.client.force_authenticate(user=self.warga_a)

        url = reverse('report-list')
        payload = {
            'category': 'Fasilitas Umum',
            'description': 'Deskripsi tanpa judul.',
            'location': 'Gedung A',
        }

        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', response.data)

    def test_19_api_create_report_tanpa_description_ditolak(self):
        self.client.force_authenticate(user=self.warga_a)

        url = reverse('report-list')
        payload = {
            'title': 'Laporan Tanpa Deskripsi',
            'category': 'Fasilitas Umum',
            'location': 'Gedung A',
        }

        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('description', response.data)

    def test_20_api_create_report_xss_disimpan_literal(self):
        self.client.force_authenticate(user=self.warga_a)

        url = reverse('report-list')
        payload = {
            'title': 'Percobaan XSS Tambahan',
            'category': 'Keamanan',
            'description': '<script>alert("xss")</script>',
            'location': 'Gedung B',
        }

        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        report = Report.objects.get(title='Percobaan XSS Tambahan')
        self.assertEqual(report.description, '<script>alert("xss")</script>')

    def test_21_api_update_draft_milik_sendiri_berhasil(self):
        self.client.force_authenticate(user=self.warga_a)

        url = reverse('report-detail', kwargs={'pk': self.draft_a.pk})
        payload = {
            'title': 'Draft Milik A Diubah',
            'category': 'Infrastruktur',
            'description': 'Draft berhasil diubah oleh pemilik.',
            'location': 'Lokasi A Baru',
            'status': 'DRAFT',
        }

        response = self.client.put(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.draft_a.refresh_from_db()
        self.assertEqual(self.draft_a.title, 'Draft Milik A Diubah')

    def test_22_api_update_reported_milik_sendiri_ditolak(self):
        self.client.force_authenticate(user=self.warga_a)

        original_title = self.reported_a.title

        url = reverse('report-detail', kwargs={'pk': self.reported_a.pk})
        payload = {
            'title': 'Reported Tidak Boleh Diubah',
            'category': self.reported_a.category,
            'description': self.reported_a.description,
            'location': self.reported_a.location,
            'status': self.reported_a.status,
        }

        response = self.client.put(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.reported_a.refresh_from_db()
        self.assertEqual(self.reported_a.title, original_title)

    def test_23_api_delete_draft_orang_lain_tidak_bisa(self):
        self.client.force_authenticate(user=self.warga_a)

        url = reverse('report-detail', kwargs={'pk': self.draft_b.pk})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(
            Report.objects.filter(pk=self.draft_b.pk).exists()
        )


class AdditionalMonolithicViewTests(TestCase):
    def setUp(self):
        self.warga = User.objects.create_user(
            username='warga_view',
            email='warga_view@gmail.com',
            password='TestPass123!',
            is_admin=False,
        )

        self.admin = User.objects.create_user(
            username='admin_view',
            email='admin_view@gmail.com',
            password='AdminPass123!',
            is_admin=True,
            is_staff=True,
        )

        self.report = Report.objects.create(
            title='Laporan View',
            category='Infrastruktur',
            description='Deskripsi laporan untuk view.',
            location='Lokasi View',
            status='REPORTED',
            reporter=self.warga,
        )

        self.draft = Report.objects.create(
            title='Draft View',
            category='Kebersihan',
            description='Deskripsi draft untuk view.',
            location='Lokasi Draft',
            status='DRAFT',
            reporter=self.warga,
        )

    def test_24_home_dan_report_list_view_berhasil_diakses(self):
        home_response = self.client.get(reverse('home'))
        list_response = self.client.get(reverse('report_list'))

        self.assertEqual(home_response.status_code, 200)
        self.assertEqual(list_response.status_code, 200)

    def test_25_report_search_dan_detail_json_berhasil_diakses(self):
        search_response = self.client.get(
            reverse('report_search'),
            {'q': 'Laporan'}
        )

        detail_json_response = self.client.get(
            reverse('detail_report_json', kwargs={'pk': self.report.pk})
        )

        self.assertEqual(search_response.status_code, 200)
        self.assertEqual(detail_json_response.status_code, 200)
        self.assertIn('results', search_response.json())
        self.assertEqual(detail_json_response.json()['title'], 'Laporan View')

    def test_26_report_detail_view_public_berhasil_diakses(self):
        response = self.client.get(
            reverse('detail_report', kwargs={'pk': self.report.pk})
        )

        self.assertEqual(response.status_code, 200)

    def test_27_admin_edit_dan_delete_view_ditolak(self):
        self.client.login(
            username='admin_view',
            password='AdminPass123!'
        )

        edit_response = self.client.get(
            reverse('edit_report', kwargs={'pk': self.report.pk})
        )

        delete_response = self.client.get(
            reverse('delete_report', kwargs={'pk': self.report.pk})
        )

        self.assertEqual(edit_response.status_code, 403)
        self.assertEqual(delete_response.status_code, 403)

    def test_28_admin_edit_dan_delete_post_ditolak(self):
        self.client.login(
            username='admin_view',
            password='AdminPass123!'
        )

        original_title = self.report.title

        edit_payload = {
            'title': 'Laporan View Diubah Admin',
            'category': 'Infrastruktur',
            'description': 'Deskripsi laporan sudah diubah admin.',
            'location': 'Lokasi View Baru',
            'status': 'REPORTED',
        }

        edit_response = self.client.post(
            reverse('edit_report', kwargs={'pk': self.report.pk}),
            edit_payload
        )

        self.assertEqual(edit_response.status_code, 403)

        self.report.refresh_from_db()
        self.assertEqual(self.report.title, original_title)
        self.assertNotEqual(self.report.title, 'Laporan View Diubah Admin')

        delete_response = self.client.post(
            reverse('delete_report', kwargs={'pk': self.report.pk})
        )

        self.assertEqual(delete_response.status_code, 403)
        self.assertTrue(
            Report.objects.filter(pk=self.report.pk).exists()
        )

    def test_29_update_status_admin_valid_dan_invalid(self):
        self.client.login(
            username='admin_view',
            password='AdminPass123!'
        )

        valid_response = self.client.post(
            reverse('update_status', kwargs={'pk': self.report.pk}),
            {'status': 'VERIFIED'}
        )

        self.assertEqual(valid_response.status_code, 302)

        self.report.refresh_from_db()
        self.assertEqual(self.report.status, 'VERIFIED')

        invalid_response = self.client.post(
            reverse('update_status', kwargs={'pk': self.report.pk}),
            {'status': 'RESOLVED'}
        )

        self.assertEqual(invalid_response.status_code, 302)

        self.report.refresh_from_db()
        self.assertEqual(self.report.status, 'VERIFIED')